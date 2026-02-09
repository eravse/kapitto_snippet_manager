import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { licenseKey } = await req.json();

        if (!licenseKey || typeof licenseKey !== 'string') {
            return NextResponse.json({ error: 'Invalid license key' }, { status: 400 });
        }

        // Basic validation (length check or format)
        if (licenseKey.length < 8) {
            return NextResponse.json({ error: 'License key too short' }, { status: 400 });
        }

        // Create the license check file in root
        // User requested "licence.check", but we support both. We'll write "licence.check" as per request.
        const licensePath = path.join(process.cwd(), 'licence.check');

        // Write the key content (or some hash/metadata) to the file
        fs.writeFileSync(licensePath, `Valid: ${new Date().toISOString()}\nKey: ${licenseKey}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('License activation error:', error);
        return NextResponse.json({ error: 'Failed to activate license' }, { status: 500 });
    }
}
