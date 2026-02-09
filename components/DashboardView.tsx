
'use client';

import {
    BarChart3,
    Code2,
    Folder,
    Tag,
    BookOpen,
    Heart,
    TrendingUp,
    Activity,
    ChevronRight,
    Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
import NavLayout from '@/components/NavLayout';

interface DashboardViewProps {
    user: {
        name?: string;
        email: string;
    };
    analytics: {
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
    };
}

export default function DashboardView({ user, analytics }: DashboardViewProps) {
    const router = useRouter();

    const stats = [
        { label: 'Toplam Snippet', value: analytics?.stats?.totalSnippets || 0, icon: Code2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Klasörler', value: analytics?.stats?.totalFolders || 0, icon: Folder, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'Kategoriler', value: analytics?.stats?.totalCategories || 0, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { label: 'Etiketler', value: analytics?.stats?.totalTags || 0, icon: Tag, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        { label: 'Favoriler', value: analytics?.stats?.favoriteSnippets || 0, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
        { label: 'Genel', value: analytics?.stats?.publicSnippets || 0, icon: TrendingUp, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
    ];

    return (
        <NavLayout>
            <div className="p-4 md:p-8 bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen">
                <div className="mx-auto">

                    {/* Header Bölümü */}
                    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                                <div className="h-10 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                                <span className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
                                    <Activity size={28} />
                                </span>
                                Dashboard
                            </h1>
                            <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
                                Hoş geldin, <span className="text-blue-600 dark:text-blue-400">@{user.name || 'kullanici'}</span>. Kod kütüphanen kontrol altında.
                            </p>
                        </div>
                        <div className="flex gap-2 text-sm font-medium bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl">Giriş</button>
                            <button className="px-4 py-2 text-slate-500">Ayarlar</button>
                        </div>
                    </div>

                    {/* İstatistik Kartları */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5 mb-10">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                            >
                                <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                        {/* Aktivite Grafiği */}
                        <div className="lg:col-span-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Haftalık Aktivite</h2>
                                <select className="bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs font-bold px-3 py-2 outline-none">
                                    <option>Son 7 Gün</option>
                                    <option>Son 30 Gün</option>
                                </select>
                            </div>
                            <div className="h-[300px] w-100%">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics?.snippetsByDay || []}>
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.8} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={35} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Popüler Kategoriler */}
                        <div className="lg:col-span-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
                            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Kategoriler</h2>
                            <div className="space-y-4">
                                {analytics?.topCategories?.slice(0, 6).map((category: any) => (
                                    <div key={category.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold">
                                                {category.icon || category.name.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">{category.name}</span>
                                        </div>
                                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 px-3 py-1 rounded-full group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                            {category._count.snippets}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Son Snippetlar Listesi */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock className="text-blue-500" size={20} />
                                Son Eklenenler
                            </h2>
                            <button className="text-sm font-bold text-blue-600 hover:underline">Tümünü Gör</button>
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {analytics?.recentSnippets?.map((snippet: any) => (
                                <div
                                    key={snippet.id}
                                    className="group flex items-center justify-between p-5 hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-500">
                                            <Code2 size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors tracking-tight">
                                                {snippet.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                                                    {snippet.language?.name}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium italic">
                                                    {snippet.category?.name || 'Genel'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden md:block text-right">
                                            <p className="text-xs font-bold text-slate-400">{new Date(snippet.createdAt).toLocaleDateString('tr-TR')}</p>
                                            <p className="text-[10px] text-slate-300">Oluşturuldu</p>
                                        </div>
                                        <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={20} />
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
