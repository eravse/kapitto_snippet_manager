import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, parentId } = body;

    const existingFolder = await prisma.folder.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const folder = await prisma.folder.update({
      where: { id: parseInt(id) },
      data: {
        name,
        parentId,
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'folder',
      entityId: folder.id,
      oldValue: existingFolder.name,
      newValue: folder.name,
      details: `Klasör güncellendi: ${name}`,
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error('Folder PUT error:', error);
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gereklidir' }, { status: 403 });
    }

    const folder = await prisma.folder.findUnique({
      where: { id: parseInt(id) },
    });

    await prisma.folder.delete({
      where: { id: parseInt(id) },
    });

    await createAuditLog({
      action: 'DELETE',
      entity: 'folder',
      entityId: parseInt(id),
      details: `Klasör silindi: ${folder?.name}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Folder DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}
