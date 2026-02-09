import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { checkProLicense } from '@/lib/license';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isPro = await checkProLicense();
    if (!isPro) {
      return NextResponse.json({ error: 'Pro feature required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    const team = await prisma.team.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'team',
      entityId: team.id,
      details: `Takım güncellendi: ${name}`,
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error('Team PUT error:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gereklidir' }, { status: 403 });
    }

    const isPro = await checkProLicense();
    if (!isPro) {
      return NextResponse.json({ error: 'Pro feature required' }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id: parseInt(id) },
    });

    await prisma.team.delete({
      where: { id: parseInt(id) },
    });

    await createAuditLog({
      action: 'DELETE',
      entity: 'team',
      entityId: parseInt(id),
      details: `Takım silindi: ${team?.name}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Team DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}
