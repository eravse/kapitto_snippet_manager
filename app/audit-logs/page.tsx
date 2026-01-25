'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavLayout from '@/components/NavLayout';
import {
  FileText, Filter, Search, Calendar, User,
  Activity, Globe, Info, ChevronRight, Database, X, Eye
} from 'lucide-react';

export default function AuditLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [filterEntity, setFilterEntity] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<any>(null); // Detay modalı için

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const loadLogs = useCallback(async () => {
    if (!user) return;
    setLoadingLogs(true);
    try {
      const url = filterEntity
          ? `/api/audit-logs?entity=${filterEntity}&limit=100`
          : '/api/audit-logs?limit=100';
      const response = await fetch(url);
      const data = await response.json();
      setLogs(Array.isArray(data) ? data : (data.logs || []));
    } catch (error) {
      console.error('Load logs error:', error);
    } finally {
      setLoadingLogs(false);
    }
  }, [user, filterEntity]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getActionStyles = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
      case 'UPDATE': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'DELETE': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800';
      case 'DOWNLOAD': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800';
      case 'LOGIN': return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
      case 'LOGOUT': return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      default: return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return {
      full: d.toLocaleString('tr-TR'),
      time: d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      date: d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
    };
  };

  if (authLoading || !user) return null;

  return (
      <NavLayout>
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-[#0b101a] min-h-screen">
          <div className="mx-auto">

            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <h1 className="text-3xl font-black flex items-center gap-3 text-slate-800 dark:text-white">
                  <div className="p-2.5 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
                    <FileText className="text-white" size={26} />
                  </div>
                  Sistem Günlükleri
                </h1>
                <p className="text-slate-500 font-medium mt-2 ml-1">Tüm kritik işlemler ve kullanıcı hareketleri.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors">
                    <Filter size={18} />
                  </div>
                  <select
                      value={filterEntity}
                      onChange={(e) => setFilterEntity(e.target.value)}
                      className="pl-12 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-bold text-sm text-slate-700 dark:text-slate-200 appearance-none shadow-sm cursor-pointer"
                  >
                    <option value="">Tüm Varlıklar</option>
                    <option value="snippet">Snippets</option>
                    <option value="download">İndirmeler</option>
                    <option value="category">Kategoriler</option>
                    <option value="folder">Klasörler</option>
                    <option value="user">Kullanıcılar</option>
                    <option value="team">Takımlar</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            {/* Logs Table / List */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm overflow-hidden transition-all">
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full text-left border-collapse">
                  <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700">
                    <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Zaman Akışı</th>
                    <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Aktör</th>
                    <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Eylem</th>
                    <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Varlık / Kaynak</th>
                    <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">İşlem IP</th>
                    <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Detay</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {loadingLogs ? (
                      <tr>
                        <td colSpan={6} className="py-20 text-center">
                          <Activity className="animate-spin text-amber-500 mx-auto mb-4" size={32} />
                          <span className="text-slate-400 font-bold">Veriler Getiriliyor...</span>
                        </td>
                      </tr>
                  ) : logs.length > 0 ? (
                      logs.map((log) => {
                        const dateParts = formatDate(log.createdAt);
                        return (
                            <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">{dateParts.date}</span>
                                  <span className="text-[11px] font-bold text-slate-400">{dateParts.time}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {log.user ? (
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-600">
                                        {log.user.name?.[0] || <User size={14} />}
                                      </div>
                                      <div className="flex flex-col max-w-[150px]">
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">{log.user.name || 'Sistem'}</span>
                                        <span className="text-[10px] font-bold text-slate-400 truncate tracking-tight">{log.user.email}</span>
                                      </div>
                                    </div>
                                ) : (
                                    <span className="text-[11px] font-black text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">SYSTEM_JOB</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                            <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl border ${getActionStyles(log.action)}`}>
                              {log.action}
                            </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Database size={14} className="text-slate-400" />
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                                {log.entity}
                              </span>
                                  {log.entityId && (
                                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                  #{log.entityId}
                                </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-600 transition-colors">
                                  <Globe size={14} />
                                  <span className="text-[11px] font-mono font-bold tracking-tighter">
                                {log.ipAddress || '127.0.0.1'}
                              </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                    onClick={() => setSelectedLog(log)}
                                    className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-600 text-slate-400 hover:text-amber-500 transition-all shadow-none hover:shadow-lg"
                                >
                                  <Eye size={18} />
                                </button>
                              </td>
                            </tr>
                        );
                      })
                  ) : (
                      <tr>
                        <td colSpan={6} className="py-20 text-center text-slate-400 font-medium">Log kaydı bulunamadı.</td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Log Detail Modal */}
        {selectedLog && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-50 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl border ${getActionStyles(selectedLog.action)}`}>
                      <Activity size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800 dark:text-white">İşlem Detayları</h2>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">LOG ID: #{selectedLog.id}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all text-slate-400">
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Kullanıcı</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedLog.user?.name || 'Sistem'}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Tarih</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDate(selectedLog.createdAt).full}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">İşlem Verisi (Details)</label>
                    <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto border-4 border-slate-800">
                  <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                    {selectedLog.details || '// Detay bilgisi mevcut değil.'}
                  </pre>
                    </div>
                  </div>

                  <button
                      onClick={() => setSelectedLog(null)}
                      className="w-full py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-white rounded-xl font-black transition-all"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
        )}
      </NavLayout>
  );
}