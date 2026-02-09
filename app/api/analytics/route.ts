
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAnalyticsData } from '@/lib/analytics';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getAnalyticsData(session.id);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
