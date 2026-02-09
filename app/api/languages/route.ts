import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const languages = await prisma.language.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(languages);
  } catch (error) {
    console.error('Languages GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch languages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, monacoId } = body;

    if (!name || !monacoId) {
      return NextResponse.json({ error: 'Name and monacoId are required' }, { status: 400 });
    }

    const language = await prisma.language.create({
      data: {
        name,
        monacoId,
      },
      // Since language model doesn't have an audit log relation setup in the provided context,
      // we might skip detailed relation logging or just log generally if system supports.
      // Based on other files, we should use createAuditLog.
    });

    await createAuditLog({
      action: 'CREATE',
      entity: 'language', // Assuming 'language' is a valid entity type or string
      entityId: language.id,
      details: `Dil oluşturuldu: ${name}`,
    });

    return NextResponse.json(language, { status: 201 });
  } catch (error) {
    console.error('Languages POST error:', error);
    return NextResponse.json({ error: 'Failed to create language' }, { status: 500 });
  }
}
