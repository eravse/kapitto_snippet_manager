/*
 * ---------------------------------------------------------
 * K A P I T T O | Snippet Manager
 * ---------------------------------------------------------
 * Maintainer: Erdem Avni Selçuk (eravse)
 * Website:    eravse.com
 * License:    Private / (c) 2026
 * ---------------------------------------------------------
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavLayout from '@/components/NavLayout';
import { 
  BarChart3, 
  Code2, 
  Folder, 
  Tag, 
  BookOpen, 
  Heart,
  TrendingUp,
  Activity 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Analytics {
  stats: {
    totalSnippets: number;
    totalFolders: number;
    totalCategories: number;
    totalTags: number;
    publicSnippets: number;
    favoriteSnippets: number;
  };
  recentSnippets: any[];
  topCategories: any[];
  topLanguages: any[];
  snippetsByDay: Array<{ date: string; count: number }>;
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Toplam Snippet', value: analytics?.stats.totalSnippets || 0, icon: Code2, color: 'bg-blue-500' },
    { label: 'Klasörler', value: analytics?.stats.totalFolders || 0, icon: Folder, color: 'bg-green-500' },
    { label: 'Kategoriler', value: analytics?.stats.totalCategories || 0, icon: BookOpen, color: 'bg-purple-500' },
    { label: 'Etiketler', value: analytics?.stats.totalTags || 0, icon: Tag, color: 'bg-orange-500' },
    { label: 'Favori Snippet', value: analytics?.stats.favoriteSnippets || 0, icon: Heart, color: 'bg-red-500' },
    { label: 'Genel Snippet', value: analytics?.stats.publicSnippets || 0, icon: TrendingUp, color: 'bg-cyan-500' },
  ];

  return (
    <NavLayout>
      <div className="p-6">
        <div className="max-w mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Activity className="text-blue-500" />
              Ana Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Hoş geldin, {user.name || user.email}! İşte genel görünüm:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="text-white" size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Son 7 Günlük Aktivite</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics?.snippetsByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Popüler Kategoriler</h2>
              <div className="space-y-3">
                {analytics?.topCategories.slice(0, 5).map((category: any) => (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {category.icon && <span>{category.icon}</span>}
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                      {category._count.snippets} snippet
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Son Eklenen Snippet'ler</h2>
            <div className="space-y-3">
              {analytics?.recentSnippets.map((snippet: any) => (
                <div
                  key={snippet.id}
                  className="flex items-center justify-between p-3 hover:bg-[var(--card-hover)] rounded-lg transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{snippet.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {snippet.language?.name} • {snippet.category?.name || 'Kategorisiz'}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(snippet.createdAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </NavLayout>
  );
}
