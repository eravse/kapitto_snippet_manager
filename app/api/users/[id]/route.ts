import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, role, isActive } = body;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        name,
        role,
        isActive,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'user',
      entityId: user.id,
      details: `Kullanıcı güncellendi: ${user.email}`,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('User PUT error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();

    // Güvenlik kontrolü
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userIdToDelete = parseInt(id);

    // Kendi kendini silmeyi engelle
    if (userIdToDelete === session.id) {
      return NextResponse.json({ error: 'Kendi hesabınızı silemezsiniz' }, { status: 400 });
    }

    // Kullanıcıyı sil (Prisma cascade delete ayarlı değilse önce ilişkili verileri silmek gerekebilir)
    await prisma.user.delete({
      where: { id: userIdToDelete },
    });

    // Log oluştur
    await createAuditLog({
      action: 'DELETE',
      entity: 'user',
      entityId: userIdToDelete,
      details: `Kullanıcı tamamen silindi. ID: ${id}`,
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('User DELETE error:', error);
    return NextResponse.json({ error: 'Kullanıcı silinirken bir hata oluştu. Bağlı verileri (snippet vb.) olabilir.' }, { status: 500 });
  }
}