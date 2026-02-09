import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

// Next.js 15 için Promise tip tanımı
type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function POST(
    req: NextRequest,
    context: RouteContext
) {
    try {
        // 1. params'ı await ederek id'yi alıyoruz
        const { id } = await context.params;
        const { versionId } = await req.json();
        const snippetId = parseInt(id);

        if (isNaN(snippetId)) {
            return NextResponse.json({ error: "Geçersiz Snippet ID" }, { status: 400 });
        }

        // 2. Hedef versiyonu bul
        const targetVersion = await prisma.snippetVersion.findUnique({
            where: { id: versionId }
        });

        if (!targetVersion) {
            return NextResponse.json({ error: "Versiyon bulunamadı" }, { status: 404 });
        }

        // 3. Ana snippet tablosunu bu kodla güncelle
        const updatedSnippet = await prisma.snippet.update({
            where: { id: snippetId },
            data: {
                code: targetVersion.code,
                title: targetVersion.title,
            }
        });

        // 4. Geri yükleme işlemini yeni bir "Minor" versiyon olarak kaydet
        const currentMinorCount = await prisma.snippetVersion.count({
            where: { snippetId, minor : targetVersion.minor }
        });

        await prisma.snippetVersion.create({
            data: {
                snippetId: snippetId,
                code: targetVersion.code,
                title: `${targetVersion.title} (Geri Yüklendi)`,
                minor:  targetVersion.minor
            }
        });

        // Audit log eklemeyi unutmayalım (opsiyonel ama önerilir)
        await createAuditLog({
            action: 'UPDATE',
            entity: 'snippet',
            entityId: snippetId,
            details: `Snippet versiyon ${versionId} geri yüklendi.`,
        });

        return NextResponse.json(updatedSnippet);
    } catch (error) {
        console.error("Restore Error:", error);
        return NextResponse.json({ error: "Geri yükleme işlemi başarısız" }, { status: 500 });
    }
}