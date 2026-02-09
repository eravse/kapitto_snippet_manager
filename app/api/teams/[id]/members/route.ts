import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { checkProLicense } from '@/lib/license';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { userId, role } = body;

    const member = await prisma.teamMember.create({
      data: {
        teamId: parseInt(id),
        userId,
        role: role || 'member',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entity: 'team',
      entityId: parseInt(id),
      details: `Takım üyesi eklendi: ${member.user.email}`,
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Team member POST error:', error);
    return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    await prisma.teamMember.delete({
      where: { id: parseInt(memberId) },
    });

    await createAuditLog({
      action: 'DELETE',
      entity: 'team',
      entityId: parseInt(id),
      details: `Takım üyesi çıkarıldı`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Team member DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { memberId, role } = body;

    if (!memberId || !role) {
      return NextResponse.json({ error: 'Member ID and role are required' }, { status: 400 });
    }

    const updatedMember = await prisma.teamMember.update({
      where: { id: parseInt(memberId) },
      data: { role },
      include: {
        user: { select: { email: true } }
      }
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'team',
      entityId: parseInt(id),
      details: `Takım üyesi rolü güncellendi: ${updatedMember.user.email} -> ${role}`,
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Team member PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update team member role' }, { status: 500 });
  }
}
