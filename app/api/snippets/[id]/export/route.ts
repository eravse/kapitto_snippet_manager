import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { checkProLicense } from '@/lib/license';
import { exportToJSON, exportToMarkdown, getSnippetFilename } from '@/lib/export/formats';
import { generatePrintableHTML } from '@/lib/export/pdf';
import { createAuditLog } from '@/lib/audit';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isPro = await checkProLicense();
        if (!isPro) {
            return NextResponse.json({ error: 'Pro feature required' }, { status: 403 });
        }

        const { id } = await params;
        const searchParams = request.nextUrl.searchParams;
        const format = searchParams.get('format') || 'json';

        const snippet = await prisma.snippet.findUnique({
            where: { id: parseInt(id) },
            include: {
                language: true,
                category: true,
                folder: true,
                versions: {
                    orderBy: { id: 'desc' },
                },
                tags: {
                    include: {
                        tag: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!snippet) {
            return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
        }

        let content: string;
        let contentType: string;
        let filename: string;

        switch (format) {
            case 'json':
                content = exportToJSON(snippet as any);
                contentType = 'application/json';
                filename = `${getSnippetFilename(snippet as any)}.json`;
                break;

            case 'markdown':
            case 'md':
                content = exportToMarkdown(snippet as any);
                contentType = 'text/markdown';
                filename = `${getSnippetFilename(snippet as any)}.md`;
                break;

            case 'pdf':
                content = generatePrintableHTML(snippet as any);
                contentType = 'text/html';
                filename = `${getSnippetFilename(snippet as any)}.html`;
                break;

            default:
                return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
        }

        await createAuditLog({
            action: 'DOWNLOAD',
            entity: 'snippet',
            entityId: snippet.id,
            snippetId: snippet.id,
            details: `Snippet dışa aktarıldı: ${filename} (Format: ${format})`,
        });

        return new NextResponse(content, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
