import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const pendingSnippets = await prisma.snippet.findMany({
            where: { status: 'PENDING' },
            include: {
                user: { select: { name: true, email: true } },
                language: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(pendingSnippets);
    } catch (error) {
        console.error('Fetch Pending Error:', error);
        return NextResponse.json({ error: 'Failed to fetch pending snippets' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, approved } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Snippet ID is required' }, { status: 400 });
        }

        const snippet = await prisma.snippet.update({
            where: { id: parseInt(id) },
            data: {
                status: approved ? 'APPROVED' : 'REJECTED',
            },
        });

        await createAuditLog({
            action: 'UPDATE',
            entity: 'snippet',
            entityId: snippet.id,
            details: `Snippet ${approved ? 'onaylandı' : 'reddedildi'}: ${snippet.title}`,
        });

        return NextResponse.json({ success: true, status: snippet.status });
    } catch (error) {
        console.error('Approval Error:', error);
        return NextResponse.json({ error: 'Failed to process snippet approval' }, { status: 500 });
    }
}
