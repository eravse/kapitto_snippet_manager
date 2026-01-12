import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const folderId = searchParams.get('folderId');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');

    let where: any = {};

    if (folderId) {
      where.folderId = parseInt(folderId);
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const snippets = await prisma.snippet.findMany({
      where,
      include: {
        language: true,
        category: true,
        folder: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(snippets);
  } catch (error) {
    console.error('Snippets GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch snippets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, code, languageId, categoryId, folderId, teamId, tagIds, isPublic, isFavorite } = body;

    if (!title || !code) {
      return NextResponse.json({ error: 'Title and code are required' }, { status: 400 });
    }

    const snippet = await prisma.snippet.create({
      data: {
        title,
        description,
        code,
        languageId,
        categoryId,
        folderId,
        teamId,
        userId: session.id,
        isPublic: isPublic ?? false,
        isFavorite: isFavorite ?? false,
        tags: tagIds && tagIds.length > 0
          ? {
              create: tagIds.map((tagId: number) => ({
                tagId,
              })),
            }
          : undefined,
      },
      include: {
        language: true,
        category: true,
        folder: true,
        team: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    await prisma.snippetVersion.create({
      data: {
        snippetId: snippet.id,
        code: snippet.code,
        title: snippet.title,
        versionNum: 1,
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entity: 'snippet',
      entityId: snippet.id,
      details: `Snippet oluşturuldu: ${title}`,
    });

    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    console.error('Snippets POST error:', error);
    return NextResponse.json({ error: 'Failed to create snippet' }, { status: 500 });
  }
}
