import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    // Sadece adminlerin kullanıcı eklemesine izin ver
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    // Temel doğrulama
    if (!email || !password) {
      return NextResponse.json({ error: 'Email ve şifre gereklidir' }, { status: 400 });
    }

    // Email adresi zaten kullanımda mı kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Bu email adresi zaten kullanımda' }, { status: 400 });
    }

    // Şifreyi güvenli hale getir (Hash)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Kullanıcıyı oluştur
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
        isActive: true, // Yeni eklenen kullanıcı varsayılan olarak aktif
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Denetim kaydı oluştur
    await createAuditLog({
      action: 'CREATE',
      entity: 'user',
      entityId: newUser.id,
      details: `Yeni kullanıcı oluşturuldu: ${newUser.email} (Rol: ${newUser.role})`,
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('User POST error:', error);
    return NextResponse.json({ error: 'Kullanıcı oluşturulurken bir hata oluştu' }, { status: 500 });
  }
}

// Tüm kullanıcıları listelemek için GET metodunu da buraya ekleyebilirsin
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        _count: {
          select: {
            snippets: true,
            folders: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}