import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createGitHubGist, createGiteaSnippet } from '@/lib/integrations';

// Next.js 15+ için params bir Promise olarak tanımlanmalıdır.
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Asenkron params yapısını çözüyoruz
        const { id } = await params;
        const snippetId = parseInt(id);

        if (isNaN(snippetId)) {
            return NextResponse.json({ error: 'Invalid snippet ID' }, { status: 400 });
        }

        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { provider } = await req.json(); // 'github' or 'gitea'

        const snippet = await prisma.snippet.findUnique({
            where: { id: snippetId },
            include: {
                language: true,
            },
        });

        if (!snippet) {
            return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
        }

        // Check ownership or admin rights
        if (snippet.userId !== session.id && session.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: {
                githubAccessToken: true,
                giteaAccessToken: true,
                giteaBaseUrl: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let result;
        const filename = `${snippet.title.replace(/\s+/g, '_')}.${snippet.language?.monacoId || 'txt'}`;
        const files = {
            [filename]: { content: snippet.code }
        };

        if (provider === 'github') {
            if (!user.githubAccessToken) {
                return NextResponse.json({ error: 'GitHub access token not found' }, { status: 400 });
            }
            result = await createGitHubGist(user.githubAccessToken, {
                description: snippet.description || snippet.title,
                public: snippet.isPublic,
                files: files
            });
        } else if (provider === 'gitea') {
            if (!user.giteaAccessToken || !user.giteaBaseUrl) {
                return NextResponse.json({ error: 'Gitea configuration missing' }, { status: 400 });
            }
            result = await createGiteaSnippet(user.giteaBaseUrl, user.giteaAccessToken, {
                description: snippet.description || snippet.title,
                public: snippet.isPublic,
                files: files
            });
        } else {
            return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
        }

        // Update snippet with external URL
        const externalUrl = result.html_url || result.url;
        await prisma.snippet.update({
            where: { id: snippetId },
            data: { externalUrl },
        });

        return NextResponse.json({ success: true, url: externalUrl });

    } catch (error: any) {
        console.error('Push snippet error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to push snippet'
        }, { status: 500 });
    }
}