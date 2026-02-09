import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { checkProLicense } from '@/lib/license';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isPro = await checkProLicense();
        if (!isPro) {
            return NextResponse.json({ error: 'Pro license required' }, { status: 403 });
        }

        let settings = await prisma.systemSettings.findFirst();

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    rateLimitPerMinute: 60,
                    ddosProtectionEnabled: false,
                    maintenanceMode: false
                }
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Fetch System Security Error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { rateLimitPerMinute, ddosProtectionEnabled, maintenanceMode } = await req.json();

        const settings = await prisma.systemSettings.upsert({
            where: { id: 1 },
            update: {
                rateLimitPerMinute,
                ddosProtectionEnabled,
                maintenanceMode
            },
            create: {
                id: 1,
                rateLimitPerMinute,
                ddosProtectionEnabled,
                maintenanceMode
            }
        });

        await createAuditLog({
            action: 'UPDATE',
            entity: 'system_settings',
            entityId: settings.id,
            details: `Sistem güvenlik ayarları güncellendi: RPM=${rateLimitPerMinute}, DDoS=${ddosProtectionEnabled}, Bakım=${maintenanceMode}`,
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Update System Security Error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
