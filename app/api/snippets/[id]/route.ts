import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { isExecutableCode } from '@/lib/security';

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
  const snippetId = parseInt(id);

  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingSnippet = await prisma.snippet.findUnique({
      where: { id: snippetId },
      include: { versions: { orderBy: { id: 'desc' }, take: 1 } } // Son versiyonu hemen çekiyoruz
    });

    if (!existingSnippet) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    if (existingSnippet.userId !== session.id && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, code, languageId, categoryId, folderId, teamId, tagIds, isPublic, isFavorite } = body;

    // Değişiklik kontrolü
    const codeChanged = existingSnippet.code !== code || existingSnippet.title !== title;

    // Executable check
    const isExecutable = isExecutableCode(code);
    const isAdmin = session.role === 'admin';
    // Eğer kod değiştiyse ve yeni kod executable ise ve user admin değilse PENDING'e çek
    let newStatus = existingSnippet.status;
    if (codeChanged && isExecutable && !isAdmin) {
      newStatus = 'PENDING';
    }

    // Transaction kullanarak tüm işlemleri sağlama alıyoruz
    const updatedSnippet = await prisma.$transaction(async (tx) => {

      // 1. Mevcut tagleri temizle
      await tx.snippetTag.deleteMany({
        where: { snippetId },
      });

      // 2. Snippet'ı güncelle
      const snippet = await tx.snippet.update({
        where: { id: snippetId },
        data: {
          title,
          description,
          code,
          languageId,
          categoryId,
          folderId,
          teamId,
          isPublic: isPublic ?? existingSnippet.isPublic,
          isFavorite: isFavorite ?? existingSnippet.isFavorite,
          isExecutable,
          status: newStatus,
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
          versions: true,
          user: { select: { id: true, name: true, email: true } },
          tags: { include: { tag: true } },
        },
      });

      // 3. Kod veya Başlık değiştiyse yeni versiyon oluştur (v1.1, v1.2 mantığı)
      if (codeChanged) {
        const lastVersion = existingSnippet.versions[0];

        await tx.snippetVersion.create({
          data: {
            snippetId: snippetId,
            code: code,
            title: title,
            major: lastVersion?.major || 1,
            minor: (lastVersion?.minor || 0) + 1, // Her güncelleme bir minor versiyon artırır
            isMajor: false
          },
        });
      }

      return snippet;
    });

    // 4. Loglama
    await createAuditLog({
      action: 'UPDATE',
      entity: 'snippet',
      entityId: updatedSnippet.id,
      oldValue: existingSnippet.code,
      newValue: updatedSnippet.code,
      details: `Snippet güncellendi: ${title} ${codeChanged ? '(Yeni versiyon oluşturuldu)' : ''}`,
    });

    return NextResponse.json(updatedSnippet);
  } catch (error) {
    // Hatayı konsola detaylı yazdırıyoruz ki Prisma hatasını görebilelim
    console.error('Snippet PUT error details:', error);
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

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gereklidir' }, { status: 403 });
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
