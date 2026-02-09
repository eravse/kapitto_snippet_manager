import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

// Next.js 15 kullanıyorsanız params bir Promise olmalıdır
type RouteParams = {
    params: Promise<{ id: string; version: string }>;
};

export async function GET(
    req: NextRequest, // NextRequest kullanmak daha iyidir
    { params }: RouteParams
) {
    // 1. Parametreleri bekleyin ve string olarak alın
    const { id, version: versionStr } = await params;

    // 2. Sayısal dönüşümleri burada yapın
    const snippetId = parseInt(id);
    const majorNum = parseInt(versionStr);

    if (isNaN(snippetId) || isNaN(majorNum)) {
        return NextResponse.json({ error: "Geçersiz parametre formatı" }, { status: 400 });
    }

    const versionData = await prisma.snippetVersion.findFirst({
        where: {
            snippetId
        },
        orderBy: { createdAt: 'desc' }
    });

    if (!versionData) {
        return NextResponse.json({ error: "Versiyon bulunamadı" }, { status: 404 });
    }

    const fileName = `${versionData.title.replace(/\s+/g, '_')}_v${versionStr}.0.txt`;

    await createAuditLog({
        action: 'DOWNLOAD',
        entity: 'snippet',
        entityId: versionData.snippetId,
        details: `Snippet versiyon ${majorNum} indirildi: ${fileName}`,
    });

    return new NextResponse(versionData.code, {
        headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="${fileName}"`,
        },
    });
}