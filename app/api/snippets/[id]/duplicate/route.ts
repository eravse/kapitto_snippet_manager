// api/snippets/[id]/duplicate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Parametre tipini bir Promise olarak tanımlıyoruz
type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function POST(
    request: NextRequest,
    context: RouteContext // params doğrudan değil, context üzerinden Promise olarak gelir
) {
    try {
        // 1. params'ı asenkron olarak çözün (Unwrap)
        const { id: idStr } = await context.params;
        const id = parseInt(idStr);

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Geçersiz ID formatı' }, { status: 400 });
        }

        // 2. Orijinal snippet'i bul
        const original = await prisma.snippet.findUnique({
            where: { id },
            include: { tags: true }
        });

        if (!original) {
            return NextResponse.json({ error: 'Snippet bulunamadı' }, { status: 404 });
        }

        // 3. Yeni kopyayı oluştur
        const duplicatedSnippet = await prisma.snippet.create({
            data: {
                title: `${original.title} (Kopya)`,
                description: original.description,
                code: original.code,
                languageId: original.languageId,
                categoryId: original.categoryId,
                folderId: original.folderId,
                userId: original.userId,
                isFavorite: false,
                viewCount: 0,
            },
        });

        return NextResponse.json(duplicatedSnippet);
    } catch (error) {
        console.error('Duplicate error:', error);
        return NextResponse.json({ error: 'Kopyalama başarısız' }, { status: 500 });
    }
}