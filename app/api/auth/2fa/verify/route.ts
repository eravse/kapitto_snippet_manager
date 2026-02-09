import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verify } from 'otplib';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { token, secret } = await req.json();

        if (!token || !secret) {
            return NextResponse.json({ error: 'Token and secret are required' }, { status: 400 });
        }

        const isValid = await verify({ token, secret });

        if (!isValid) {
            return NextResponse.json({ error: 'Geçersiz doğrulama kodu' }, { status: 400 });
        }

        // Enable 2FA for the user
        await prisma.user.update({
            where: { id: session.id },
            data: {
                twoFactorEnabled: true,
                twoFactorSecret: secret,
            },
        });

        await createAuditLog({
            action: 'UPDATE',
            entity: 'user',
            entityId: session.id,
            details: '2FA (İki Faktörlü Doğrulama) etkinleştirildi.',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('2FA Verify Error:', error);
        return NextResponse.json({ error: 'Failed to verify 2FA token' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Disable 2FA
        await prisma.user.update({
            where: { id: session.id },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
            },
        });

        await createAuditLog({
            action: 'UPDATE',
            entity: 'user',
            entityId: session.id,
            details: '2FA (İki Faktörlü Doğrulama) devre dışı bırakıldı.',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('2FA Disable Error:', error);
        return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
    }
}
