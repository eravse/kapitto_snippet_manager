import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { checkProLicense } from '@/lib/license';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isPro = await checkProLicense();
    if (!isPro) {
        return NextResponse.json({ error: 'Pro feature required' }, { status: 403 });
    }

    const { url, startId, endId, username, password } = await request.json();

    if (!url || !startId || !endId) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const sendUpdate = (data: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
                sendUpdate({ type: 'progress', current: 0, total: endId - startId + 1, message: 'Taşıma hazırlıkları yapılıyor...', success: 0, failed: 0 });

                // Phase 1: Authentication Simulation
                // In a real legacy app, we would POST to /api/auth/login and get a cookie.
                // For this migration tool, we'll assume the legacy app uses simple API or session.
                sendUpdate({ type: 'progress', message: 'Legacy sisteme bağlanılıyor...', current: 0, total: endId - startId + 1, success: 0, failed: 0 });

                let successCount = 0;
                let failCount = 0;
                const total = endId - startId + 1;

                for (let i = startId; i <= endId; i++) {
                    const currentProgress = i - startId + 1;
                    try {
                        // Phase 2: Fetch Snippet
                        // We assume legacy URL structure: url/api/snippets/id or similar
                        // Since we don't have a real legacy server, we'll try to fetch and parse.
                        // The user specified "url vasıtası ile eski sniperları okuyabilme özelliği ekleyelim mesela 1 -10 arası xxxx url den oku"

                        const targetUrl = `${url.replace(/\/$/, '')}/api/snippets/${i}`;
                        const response = await fetch(targetUrl, {
                            headers: {
                                'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
                            }
                        });

                        if (response.ok) {
                            const snippetData = await response.json();

                            // Phase 3: Import to Database
                            await prisma.snippet.create({
                                data: {
                                    title: snippetData.title || `Legacy Snippet ${i}`,
                                    description: snippetData.description || 'Migrated from legacy system',
                                    code: snippetData.code || '',
                                    userId: session.id,
                                    // Map other fields if possible
                                }
                            });

                            successCount++;
                            sendUpdate({
                                type: 'progress',
                                current: currentProgress,
                                total,
                                success: successCount,
                                failed: failCount,
                                message: `Snippet ${i} başarıyla taşındı: ${snippetData.title || i}`
                            });
                        } else {
                            throw new Error(`HTTP Error ${response.status}`);
                        }
                    } catch (err: any) {
                        failCount++;
                        sendUpdate({
                            type: 'progress',
                            current: currentProgress,
                            total,
                            success: successCount,
                            failed: failCount,
                            message: `Hata: Snippet ${i} taşınamadı (${err.message})`
                        });
                    }

                    // Small delay to prevent overwhelming the server
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                await createAuditLog({
                    action: 'MIGRATION',
                    entity: 'system',
                    entityId: 0,
                    details: `Migration completed: ${successCount} success, ${failCount} failed from ${url}`,
                });

                sendUpdate({ type: 'complete', success: successCount, failed: failCount });
                controller.close();
            } catch (error: any) {
                sendUpdate({ type: 'error', message: error.message });
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
