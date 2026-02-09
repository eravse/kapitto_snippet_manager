import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, setSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { verify } from 'otplib';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, token } = body;
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email ve şifre gereklidir' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Geçersiz email veya şifre' },
        { status: 401 }
      );
    }

    // 1. IP Restriction Check
    if (user.blockedIPs?.split(',').includes(ip)) {
      return NextResponse.json({ error: 'Bu IP adresinden erişim engellenmiştir.' }, { status: 403 });
    }
    if (user.allowedIPs && !user.allowedIPs.split(',').includes(ip)) {
      return NextResponse.json({ error: 'Bu IP adresi izinli listede değil.' }, { status: 403 });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Hesabınız devre dışı bırakılmış' },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Geçersiz email veya şifre' },
        { status: 401 }
      );
    }

    // 2. 2FA Check
    if (user.twoFactorEnabled) {
      if (!token) {
        return NextResponse.json({ needs2FA: true }, { status: 200 });
      }

      const isTokenValid = await verify({ token, secret: user.twoFactorSecret || '' });
      if (!isTokenValid) {
        return NextResponse.json({ error: 'Geçersiz 2FA kodu' }, { status: 401 });
      }
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
    };

    await setSession(sessionUser);

    await createAuditLog({
      action: 'LOGIN',
      entity: 'user',
      entityId: user.id,
      details: `Kullanıcı giriş yaptı: ${email}${user.twoFactorEnabled ? ' (2FA ile)' : ''}`,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Giriş sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
