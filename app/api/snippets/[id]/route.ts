import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const snippet = await prisma.snippet.findUnique({
      where: { id: parseInt(id) },
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
    });

    if (!snippet) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    await prisma.snippet.update({
      where: { id: parseInt(id) },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(snippet);
  } catch (error) {
    console.error('Snippet GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch snippet' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingSnippet = await prisma.snippet.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingSnippet) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    if (existingSnippet.userId !== session.id && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, code, languageId, categoryId, folderId, teamId, tagIds, isPublic, isFavorite } = body;

    const codeChanged = existingSnippet.code !== code || existingSnippet.title !== title;

    await prisma.snippetTag.deleteMany({
      where: { snippetId: parseInt(id) },
    });

    const snippet = await prisma.snippet.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        code,
        languageId,
        categoryId,
        folderId,
        teamId,
        isPublic,
        isFavorite,
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

    if (codeChanged) {
      const lastVersion = await prisma.snippetVersion.findFirst({
        where: { snippetId: parseInt(id) },
        orderBy: { versionNum: 'desc' },
      });

      await prisma.snippetVersion.create({
        data: {
          snippetId: parseInt(id),
          code: snippet.code,
          title: snippet.title,
          versionNum: (lastVersion?.versionNum || 0) + 1,
        },
      });
    }

    await createAuditLog({
      action: 'UPDATE',
      entity: 'snippet',
      entityId: snippet.id,
      details: `Snippet güncellendi: ${title}`,
    });

    return NextResponse.json(snippet);
  } catch (error) {
    console.error('Snippet PUT error:', error);
    return NextResponse.json({ error: 'Failed to update snippet' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snippet = await prisma.snippet.findUnique({
      where: { id: parseInt(id) },
    });

    if (!snippet) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    if (snippet.userId !== session.id && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.snippet.delete({
      where: { id: parseInt(id) },
    });

    await createAuditLog({
      action: 'DELETE',
      entity: 'snippet',
      entityId: parseInt(id),
      details: `Snippet silindi: ${snippet.title}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Snippet DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete snippet' }, { status: 500 });
  }
}
