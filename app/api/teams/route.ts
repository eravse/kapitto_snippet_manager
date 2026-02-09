import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { checkProLicense } from '@/lib/license';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isPro = await checkProLicense();
    if (!isPro) {
      return NextResponse.json({ error: 'Pro feature required' }, { status: 403 });
    }

    const teams = await prisma.team.findMany({
      include: {
        _count: {
          select: {
            members: true,
            snippets: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Teams GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId: session.id,
            role: 'owner',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entity: 'team',
      entityId: team.id,
      details: `Takım oluşturuldu: ${name}`,
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Teams POST error:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
