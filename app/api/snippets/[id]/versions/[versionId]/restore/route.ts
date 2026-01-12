import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params;
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const version = await prisma.snippetVersion.findUnique({
      where: { id: parseInt(versionId) },
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    const lastVersion = await prisma.snippetVersion.findFirst({
      where: { snippetId: parseInt(id) },
      orderBy: { versionNum: 'desc' },
    });

    const snippet = await prisma.snippet.update({
      where: { id: parseInt(id) },
      data: {
        code: version.code,
        title: version.title,
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
      },
    });

    await prisma.snippetVersion.create({
      data: {
        snippetId: parseInt(id),
        code: snippet.code,
        title: snippet.title,
        versionNum: (lastVersion?.versionNum || 0) + 1,
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'snippet',
      entityId: parseInt(id),
      details: `Snippet version ${version.versionNum} restore edildi`,
    });

    return NextResponse.json(snippet);
  } catch (error) {
    console.error('Version restore error:', error);
    return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 });
  }
}
