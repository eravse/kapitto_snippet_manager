import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { isExecutableCode } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const folderId = searchParams.get('folderId');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');

    // Frontend'deki pagination desteği için:
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const session = await getSession();
    let where: any = {};

    if (!session || session.role !== 'admin') {
      // Admin değilse: Sadece APPROVED olanları VEYA kendi snippetlarını görsün
      where.OR = [
        { status: 'APPROVED' },
        ...(session ? [{ userId: session.id }] : []),
      ];
    }

    if (folderId) {
      where.folderId = parseInt(folderId);
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Toplam kayıt sayısını al (Frontend'deki totalPages hesabı için)
    const totalCount = await prisma.snippet.count({ where });

    const snippets = await prisma.snippet.findMany({
      where,
      include: {
        language: true,
        category: true,
        folder: true,
        // KRİTİK DÜZELTME: Versions dizisini frontend'in beklediği sırada çekiyoruz
        versions: {
          orderBy: {
            id: 'desc' // En son versiyon en üstte gelsin
          }
        },
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
      skip, // Sayfalama için
      take: limit, // Sayfalama için
    });

    // Frontend'in beklediği objeyi dönüyoruz
    return NextResponse.json({
      snippets,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    });
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

    const isExecutable = isExecutableCode(code);
    const isAdmin = session.role === 'admin';
    const initialStatus = (isExecutable && !isAdmin) ? 'PENDING' : 'APPROVED';

    // Transaction kullanarak hem snippet hem versiyonu atomik olarak oluşturuyoruz
    const result = await prisma.$transaction(async (tx) => {
      // 1. Snippet'ı oluştur
      const snippet = await tx.snippet.create({
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
          isExecutable,
          status: initialStatus,
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
          versions: true, // Frontend için boş versiyon listesi yerine yeni oluşanı görecek
        }
      });

      // 2. İlk Versiyonu Oluştur
      await tx.snippetVersion.create({
        data: {
          snippetId: snippet.id,
          code: code,
          title: title,
          major: 1,
          minor: 0,
          isMajor: true // İlk versiyon olduğu için true olması daha mantıklı olabilir
        }
      });

      return snippet;
    });

    // 3. Loglama
    await createAuditLog({
      action: 'CREATE',
      entity: 'snippet',
      entityId: result.id,
      details: `Snippet oluşturuldu: ${title} (v1.0 kaydedildi)`,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Snippets POST error:', error);
    return NextResponse.json({ error: 'Failed to create snippet' }, { status: 500 });
  }
}