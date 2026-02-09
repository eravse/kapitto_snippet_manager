import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const templates = await prisma.emailTemplate.findMany({
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(templates);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, name, subject, content, context } = body;

        if (id) {
            try {
                const template = await prisma.emailTemplate.update({
                    where: { id: parseInt(id) },
                    data: { subject, content, context }
                });
                return NextResponse.json(template);
            } catch (e: any) {
                console.error('Template update error:', e);
                return NextResponse.json({ error: 'Güncelleme hatası: ' + (e.message || 'Bilinmeyen hata') }, { status: 500 });
            }
        } else {
            if (!name) return NextResponse.json({ error: 'Şablon ismi gereklidir' }, { status: 400 });
            try {
                const template = await prisma.emailTemplate.create({
                    data: { name, subject, content, context }
                });
                return NextResponse.json(template, { status: 201 });
            } catch (e: any) {
                console.error('Template create error:', e);
                if (e.code === 'P2002') return NextResponse.json({ error: 'Bu isimde bir şablon zaten mevcut' }, { status: 400 });
                return NextResponse.json({ error: 'Oluşturma hatası: ' + (e.message || 'Bilinmeyen hata') }, { status: 500 });
            }
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
    }
}
