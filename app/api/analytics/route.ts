import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalSnippets,
      totalFolders,
      totalCategories,
      totalTags,
      publicSnippets,
      favoriteSnippets,
      recentSnippets,
      topCategories,
      topLanguages,
    ] = await Promise.all([
      prisma.snippet.count(),
      prisma.folder.count(),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.snippet.count({ where: { isPublic: true } }),
      prisma.snippet.count({ where: { isFavorite: true } }),
      prisma.snippet.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          language: true,
          category: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.category.findMany({
        take: 5,
        include: {
          _count: {
            select: { snippets: true },
          },
        },
        orderBy: {
          snippets: {
            _count: 'desc',
          },
        },
      }),
      prisma.language.findMany({
        take: 5,
        include: {
          _count: {
            select: { snippets: true },
          },
        },
        orderBy: {
          snippets: {
            _count: 'desc',
          },
        },
      }),
    ]);

    const snippetsByDay = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM snippets
      WHERE created_at >= DATE('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    return NextResponse.json({
      stats: {
        totalSnippets,
        totalFolders,
        totalCategories,
        totalTags,
        publicSnippets,
        favoriteSnippets,
      },
      recentSnippets,
      topCategories,
      topLanguages,
      snippetsByDay,
    });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
