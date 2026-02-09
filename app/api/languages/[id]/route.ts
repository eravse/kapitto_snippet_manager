import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getSession();

        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, monacoId } = body;

        const existingLanguage = await prisma.language.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingLanguage) {
            return NextResponse.json({ error: 'Language not found' }, { status: 404 });
        }

        const language = await prisma.language.update({
            where: { id: parseInt(id) },
            data: {
                name,
                monacoId,
            },
        });

        await createAuditLog({
            action: 'UPDATE',
            entity: 'language',
            entityId: language.id,
            oldValue: existingLanguage.name,
            newValue: language.name,
            details: `Dil güncellendi: ${name}`,
        });

        return NextResponse.json(language);
    } catch (error) {
        console.error('Language PUT error:', error);
        return NextResponse.json({ error: 'Failed to update language' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getSession();

        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gereklidir' }, { status: 403 });
        }

        const language = await prisma.language.findUnique({
            where: { id: parseInt(id) },
        });

        if (!language) {
            return NextResponse.json({ error: 'Language not found' }, { status: 404 });
        }

        // Check if used in snippets? Prisma constraints might handle this, but for safety:
        // This is optional depending on requirements, but for now we'll let Prisma throw if constraint violation.

        await prisma.language.delete({
            where: { id: parseInt(id) },
        });

        await createAuditLog({
            action: 'DELETE',
            entity: 'language',
            entityId: parseInt(id),
            details: `Dil silindi: ${language.name}`,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Language DELETE error:', error);
        // Likely foreign key constraint violation if used
        return NextResponse.json({ error: 'Failed to delete language' }, { status: 500 });
    }
}
