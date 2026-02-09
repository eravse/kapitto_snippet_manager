
import { prisma } from '@/lib/prisma';

export async function getAnalyticsData(userId: number) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

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
    weeklySnippets
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
    // Fetch snippets from last 7 days for manual aggregation (DB Agnostic)
    prisma.snippet.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      select: {
        createdAt: true
      }
    })
  ]);

  // Aggregate weekly stats in JS to be DB-agnostic (Pro feature support)
  const snippetsByDayMap = new Map<string, number>();
  
  // Initialize last 7 days with 0
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    snippetsByDayMap.set(dateStr, 0);
  }

  weeklySnippets.forEach(s => {
    const dateStr = s.createdAt.toISOString().split('T')[0];
    if (snippetsByDayMap.has(dateStr)) {
      snippetsByDayMap.set(dateStr, (snippetsByDayMap.get(dateStr) || 0) + 1);
    }
  });

  const snippetsByDay = Array.from(snippetsByDayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
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
  };
}
