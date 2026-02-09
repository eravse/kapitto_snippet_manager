import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateSecret, generateURI } from 'otplib';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.id },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Generate secret (otplib default is usually base32)
        const secret = generateSecret();
        const otpauth = generateURI({
            secret,
            label: user.email,
            issuer: 'Kapitto Snippets'
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(otpauth);

        // Temp store secret in user record (or better, in session/cache, but for simplicity we'll use user record)
        // Actually, we should only save it to DB once verified. 
        // For now, return it to the frontend to keep until verification.

        return NextResponse.json({
            secret,
            qrCodeUrl,
        });
    } catch (error) {
        console.error('2FA Generate Error:', error);
        return NextResponse.json({ error: 'Failed to generate 2FA secret' }, { status: 500 });
    }
}
