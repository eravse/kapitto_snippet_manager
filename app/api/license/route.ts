import { NextRequest, NextResponse } from 'next/server';
import { checkProLicense } from '@/lib/license';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ isPro: false, error: 'Unauthorized' }, { status: 401 });
        }

        const isPro = await checkProLicense();
        return NextResponse.json({ isPro });
    } catch (error) {
        return NextResponse.json({ isPro: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
