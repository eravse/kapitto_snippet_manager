
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type GetSnippetsParams = {
    page?: number;
    limit?: number;
    search?: string;
    searchIn?: 'title' | 'description' | 'code' | 'all';
    isRegex?: boolean;
    folderId?: number;
    categoryId?: number;
    languageId?: number;
    teamId?: number;
    tagIds?: number[];
};

export type SnippetWithRelations = Prisma.SnippetGetPayload<{
    include: {
        language: true;
        category: true;
        folder: true;
        versions: true;
        team: true;
        user: {
            select: {
                id: true;
                name: true;
                email: true;
            };
        };
        tags: {
            include: {
                tag: true;
            };
        };
    };
}>;

export async function getSnippets({
    page = 1,
    limit = 10,
    search,
    searchIn = 'all',
    isRegex = false,
    folderId,
    categoryId,
    languageId,
    teamId,
    tagIds,
}: GetSnippetsParams) {
    const skip = (page - 1) * limit;
    const where: Prisma.SnippetWhereInput = {};

    if (folderId) {
        where.folderId = folderId;
    }

    if (categoryId) {
        where.categoryId = categoryId;
    }

    if (languageId) {
        where.languageId = languageId;
    }

    if (teamId) {
        where.teamId = teamId;
    }

    if (tagIds && tagIds.length > 0) {
        where.tags = {
            some: {
                tagId: {
                    in: tagIds,
                },
            },
        };
    }

    if (search) {
        // For regex search, we'll need to fetch all and filter in JS
        // This is database-agnostic but less performant for large datasets
        if (isRegex) {
            // Regex search will be handled post-query
            // For now, we'll just do a basic contains search
            // TODO: Implement regex filtering after fetch
        } else {
            // Build search conditions based on searchIn parameter
            const searchConditions: Prisma.SnippetWhereInput[] = [];

            if (searchIn === 'all' || searchIn === 'title') {
                searchConditions.push({ title: { contains: search } });
            }
            if (searchIn === 'all' || searchIn === 'description') {
                searchConditions.push({ description: { contains: search } });
            }
            if (searchIn === 'all' || searchIn === 'code') {
                searchConditions.push({ code: { contains: search } });
            }

            if (searchConditions.length > 0) {
                where.OR = searchConditions;
            }
        }
    }

    const [totalCount, snippets] = await Promise.all([
        prisma.snippet.count({ where }),
        prisma.snippet.findMany({
            where,
            include: {
                language: true,
                category: true,
                folder: true,
                versions: {
                    orderBy: {
                        id: 'desc',
                    },
                },
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
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take: limit,
        }),
    ]);

    // Post-process for regex if needed
    let filteredSnippets = snippets;
    if (search && isRegex) {
        try {
            const regex = new RegExp(search, 'i');
            filteredSnippets = snippets.filter((snippet) => {
                if (searchIn === 'all') {
                    return (
                        regex.test(snippet.title) ||
                        regex.test(snippet.description || '') ||
                        regex.test(snippet.code)
                    );
                } else if (searchIn === 'title') {
                    return regex.test(snippet.title);
                } else if (searchIn === 'description') {
                    return regex.test(snippet.description || '');
                } else if (searchIn === 'code') {
                    return regex.test(snippet.code);
                }
                return false;
            });
        } catch (error) {
            // Invalid regex, return empty array to indicate no matches for invalid pattern
            console.error('Invalid regex pattern:', error);
            filteredSnippets = [];
        }
    }

    return {
        snippets: filteredSnippets,
        totalCount: isRegex ? filteredSnippets.length : totalCount,
        totalPages: Math.ceil((isRegex ? filteredSnippets.length : totalCount) / limit),
        currentPage: page,
    };
}
