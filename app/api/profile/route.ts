import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { checkProLicense } from '@/lib/license';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        githubUsername: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, avatar, githubUsername, allowedIPs, blockedIPs, currentPassword, newPassword } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id: session.id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // IP Restriction Gating (Pro only)
    if (allowedIPs !== undefined || blockedIPs !== undefined) {
      const isPro = await checkProLicense();
      if (!isPro) {
        return NextResponse.json({ error: 'Pro license required for IP restrictions' }, { status: 403 });
      }
    }

    const data: any = { name, avatar, githubUsername };

    if (allowedIPs !== undefined) data.allowedIPs = allowedIPs;
    if (blockedIPs !== undefined) data.blockedIPs = blockedIPs;

    // Şifre güncelleme mantığı
    if (currentPassword && newPassword) {
      const { verifyPassword } = await import('@/lib/auth');
      const isPasswordValid = await verifyPassword(currentPassword, existingUser.password);

      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Mevcut şifre hatalı' }, { status: 400 });
      }

      data.password = await hashPassword(newPassword);
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        githubUsername: true,
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'user',
      entityId: user.id,
      oldValue: existingUser.name || '',
      newValue: user.name || '',
      details: 'Güvenlik/Profil ayarları güncellendi',
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
