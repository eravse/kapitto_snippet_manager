import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkProLicense } from '@/lib/license';
import { exportToJSON, exportToMarkdown, getSnippetFilename } from '@/lib/export/formats';
import { generatePrintableHTML } from '@/lib/export/pdf';
import JSZip from 'jszip';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
    try {
        // 1. Pro License Check
        const isPro = await checkProLicense();
        if (!isPro) {
            return NextResponse.json(
                { error: 'Bulk Export is a Pro feature. Please upgrade your license.' },
                { status: 403 }
            );
        }

        // 2. Parse Request
        const { snippetIds, format } = await req.json();

        if (!snippetIds || !Array.isArray(snippetIds) || snippetIds.length === 0) {
            return NextResponse.json(
                { error: 'No snippet IDs provided.' },
                { status: 400 }
            );
        }

        // 3. Fetch Snippets
        const snippets = await prisma.snippet.findMany({
            where: {
                id: { in: snippetIds },
            },
            include: {
                language: true,
                category: true,
                folder: true,
                tags: {
                    include: {
                        tag: true,
                    },
                },
                versions: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
            },
        });

        if (snippets.length === 0) {
            return NextResponse.json(
                { error: 'No snippets found for the provided IDs.' },
                { status: 404 }
            );
        }

        // 4. Generate ZIP
        const zip = new JSZip();

        for (const snippet of snippets) {
            let content = '';
            let extension = '';

            // Format mapping
            switch (format) {
                case 'json':
                    content = JSON.stringify(exportToJSON(snippet as any), null, 2);
                    extension = 'json';
                    break;
                case 'md':
                    content = exportToMarkdown(snippet as any);
                    extension = 'md';
                    break;
                case 'pdf':
                    // We generate the printable HTML since we can't do server-side PDF easily
                    content = generatePrintableHTML(snippet as any);
                    extension = 'html';
                    break;
                default:
                    content = JSON.stringify(exportToJSON(snippet as any), null, 2);
                    extension = 'json';
            }

            const filename = `${getSnippetFilename(snippet as any)}.${extension}`;
            zip.file(filename, content);
        }

        // 5. Generate Response
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const zipName = `kapitto_export_${timestamp}.zip`;

        await createAuditLog({
            action: 'DOWNLOAD',
            entity: 'snippet',
            entityId: 0,
            details: `Toplu dışa aktarım yapıldı: ${zipName} (${snippets.length} snippet)`,
        });

        return new NextResponse(new Uint8Array(zipBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${zipName}"`,
            },
        });

    } catch (error) {
        console.error('Bulk Export Error:', error);
        return NextResponse.json(
            { error: 'Internal server error during bulk export.' },
            { status: 500 }
        );
    }
}
