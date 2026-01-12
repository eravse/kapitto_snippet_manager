import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const folders = await prisma.folder.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            snippets: true,
            children: true,
          },
        },
      },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error('Folders GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, parentId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        parentId,
        userId: session.id,
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entity: 'folder',
      entityId: folder.id,
      details: `Klasör oluşturuldu: ${name}`,
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error('Folders POST error:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
