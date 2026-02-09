import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { EmailService } from '@/lib/email';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getSession();

        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Mock reset link generation
        const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=mock_token_${Date.now()}`;

        // Send email using EmailService
        await EmailService.send({
            to: user.email,
            templateName: 'password_reset',
            variables: {
                name: user.name || user.email,
                reset_link: resetLink
            }
        });

        await createAuditLog({
            action: 'UPDATE',
            entity: 'user',
            entityId: user.id,
            details: `Şifre sıfırlama maili gönderildi: ${user.email}`,
        });

        return NextResponse.json({ message: 'Sıfırlama maili başarıyla gönderildi' });
    } catch (error: any) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: error.message || 'Sıfırlama maili gönderilemedi' }, { status: 500 });
    }
}
