import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { checkProLicense } from '@/lib/license';

export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isPro = await checkProLicense();
        if (!isPro) {
            return NextResponse.json(
                { error: 'Toplu işlemler Pro bir özelliktir.' },
                { status: 403 }
            );
        }

        const { snippetIds } = await req.json();

        if (!Array.isArray(snippetIds) || snippetIds.length === 0) {
            return NextResponse.json(
                { error: 'Silinecek snippet seçilmedi.' },
                { status: 400 }
            );
        }

        // Perform bulk deletion
        await prisma.snippet.deleteMany({
            where: {
                id: {
                    in: snippetIds
                },
                // Extra safety: only delete snippets owned by the user
                userId: session.id
            }
        });

        // Log the activity if Audit Log system exists (optional, keeping it simple for now)

        return NextResponse.json({ success: true, count: snippetIds.length });

    } catch (error) {
        console.error('Bulk Delete Error:', error);
        return NextResponse.json(
            { error: 'Toplu silme sırasında bir hata oluştu.' },
            { status: 500 }
        );
    }
}
