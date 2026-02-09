import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

// 1. Tip tanımını Promise olarak güncelliyoruz
type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function POST(
    req: NextRequest, // Tip güvenliği için NextRequest kullanmak önerilir
    context: RouteContext
) {
    try {
        // 2. params'ı await ile çözüyoruz
        const { id } = await context.params;
        const { code, title } = await req.json();
        const snippetId = parseInt(id);

        if (isNaN(snippetId)) {
            return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
        }

        const lastVersion = await prisma.snippetVersion.findFirst({
            where: { snippetId },
            orderBy: { id: 'desc' },
        });

        const nextMajor = (lastVersion?.major ?? 0) + 1;

        const releasedVersion = await prisma.snippetVersion.create({
            data: {
                snippetId,
                code,
                title,
                major: nextMajor,
            }
        });

        await createAuditLog({
            action: 'UPDATE',
            entity: 'snippet',
            entityId: snippetId,
            details: `Snippet versiyon yayınlandı: ${title} (v${nextMajor}.0)`,
        });

        return NextResponse.json(releasedVersion);
    } catch (error) {
        console.error("Release Error:", error);
        return NextResponse.json({ error: "Versiyon yayınlanırken bir hata oluştu" }, { status: 500 });
    }
}