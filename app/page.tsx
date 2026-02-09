
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAnalyticsData } from '@/lib/analytics';
import DashboardView from '@/components/DashboardView';

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const analytics = await getAnalyticsData(session.id);

  return <DashboardView user={session} analytics={analytics} />;
}