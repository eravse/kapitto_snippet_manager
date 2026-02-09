import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/audit';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 25;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const search = searchParams.get('search') || undefined;

    const result = await getAuditLogs({
      entity,
      limit,
      offset,
      startDate,
      endDate,
      search,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Audit logs GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
