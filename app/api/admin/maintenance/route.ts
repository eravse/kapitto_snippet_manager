import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { checkProLicense } from '@/lib/license';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const unassignedCount = await prisma.snippet.count({
            where: { folderId: null }
        });

        return NextResponse.json({ unassignedCount });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch maintenance stats' }, { status: 500 });
    }
}

export async function POST() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isPro = await checkProLicense();
        if (!isPro) {
            return NextResponse.json({ error: 'Pro feature required' }, { status: 403 });
        }

        // 1. Find or create the "Migration" folder
        let migrationFolder = await prisma.folder.findFirst({
            where: {
                name: 'Migration',
                userId: session.id
            }
        });

        if (!migrationFolder) {
            migrationFolder = await prisma.folder.create({
                data: {
                    name: 'Migration',
                    userId: session.id
                }
            });
        }

        // 2. Move unassigned snippets to this folder
        const updateResult = await prisma.snippet.updateMany({
            where: {
                folderId: null,
                userId: session.id
            },
            data: {
                folderId: migrationFolder.id
            }
        });

        // 3. Log the action
        await createAuditLog({
            action: 'MAINTENANCE',
            entity: 'folder',
            entityId: migrationFolder.id,
            details: `Bulk organized ${updateResult.count} unassigned snippets into 'Migration' folder.`
        });

        return NextResponse.json({
            success: true,
            count: updateResult.count,
            folderName: migrationFolder.name
        });
    } catch (error: any) {
        console.error('Maintenance error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
