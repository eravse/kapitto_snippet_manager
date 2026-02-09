import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { githubAccessToken, giteaAccessToken, giteaBaseUrl } = await req.json();

        const updatedUser = await prisma.user.update({
            where: { id: session.id },
            data: {
                githubAccessToken,
                giteaAccessToken,
                giteaBaseUrl,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Integration settings error:', error);
        return NextResponse.json({ error: 'Failed to save integration settings' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: {
                githubAccessToken: true,
                giteaAccessToken: true,
                giteaBaseUrl: true,
            }
        });

        // Mask tokens for security
        const maskedUser = {
            githubAccessToken: user?.githubAccessToken ? '********' : null,
            giteaAccessToken: user?.giteaAccessToken ? '********' : null,
            giteaBaseUrl: user?.giteaBaseUrl,
            hasGithubToken: !!user?.githubAccessToken,
            hasGiteaToken: !!user?.giteaAccessToken,
        };

        return NextResponse.json(maskedUser);
    } catch (error) {
        console.error('Fetch integration settings error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}
