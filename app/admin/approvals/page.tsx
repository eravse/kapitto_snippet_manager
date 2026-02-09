'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavLayout from '@/components/NavLayout';
import { Shield, Check, X, Code, User, Calendar, ExternalLink, AlertCircle, GitBranch, Github, Server, CheckCircle2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminApprovalsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [pendingSnippets, setPendingSnippets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSnippet, setSelectedSnippet] = useState<any>(null);
    const [pushing, setPushing] = useState(false);

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push('/');
        } else if (user) {
            fetchPendingSnippets();
        }
    }, [user, loading, router]);

    const fetchPendingSnippets = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/admin/snippets/approve');
            const data = await res.json();
            setPendingSnippets(data);
            if (data.length > 0 && !selectedSnippet) {
                // Auto select first
                // setSelectedSnippet(data[0]); 
            }
        } catch (error) {
            toast.error('Onay bekleyen snippetlar yüklenemedi');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproval = async (id: number, approved: boolean) => {
        try {
            const res = await fetch('/api/admin/snippets/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, approved }),
            });

            if (res.ok) {
                toast.success(approved ? 'Snippet onaylandı' : 'Snippet reddedildi');
                setPendingSnippets(prev => prev.filter(s => s.id !== id));
                if (selectedSnippet?.id === id) setSelectedSnippet(null);
            } else {
                toast.error('İşlem başarısız');
            }
        } catch (error) {
            toast.error('Hata oluştu');
        }
    };

    const handlePushToSourceControl = async (provider: 'github' | 'gitea') => {
        if (!selectedSnippet) return;
        setPushing(true);
        try {
            // Using ID from selected snippet to push. 
            // NOTE: This uses CURRENT USER'S tokens (Admin's tokens). 
            // If the goal was to push to USER'S repo, we need to impersonate or change logic.
            // Requirement implies "we must add a feature to push to source control", likely for the system/admin to publish approved snippets or for users.
            // Given this is an admin page, we assume Admin pushes to a generic repo OR we are triggering it for the user.
            // The API implementation uses `session.id` to fetch tokens. So it uses Admin's tokens.
            const res = await fetch(`/api/snippets/${selectedSnippet.id}/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(`${provider === 'github' ? 'GitHub' : 'Gitea'}'ya başarıyla gönderildi!`);
                // Update snippet info to show external URL if needed
                setSelectedSnippet({ ...selectedSnippet, externalUrl: data.url });
            } else {
                toast.error(data.error || 'Gönderim başarısız');
            }
        } catch (error) {
            toast.error('Bağlantı hatası');
        } finally {
            setPushing(false);
        }
    };

    if (loading || !user) return null;

    return (
        <NavLayout>
            <div className="h-screen flex flex-col bg-slate-50 dark:bg-[#0b101a] overflow-hidden">
                {/* Top Header */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-5 flex justify-between items-center shrink-0 z-10">
                    <div>
                        <h1 className="text-2xl font-black flex items-center gap-3 text-slate-800 dark:text-white">
                            <div className="p-2 bg-amber-500 rounded-lg shadow-lg shadow-amber-500/20">
                                <Shield className="text-white" size={20} />
                            </div>
                            Snippet Onay Merkezi
                        </h1>
                        <p className="text-slate-500 text-xs font-bold mt-1 ml-1 uppercase tracking-widest opacity-70">Admin Paneli</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">{pendingSnippets.length} BEKLEYEN</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Split View */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Left Sidebar: List */}
                    <div className="w-96 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <input
                                type="text"
                                placeholder="Listede ara..."
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {isLoading ? (
                                [1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-xl mx-2" />)
                            ) : pendingSnippets.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                    <CheckCircle2 size={40} className="mb-4 text-emerald-500 opacity-50" />
                                    <p className="font-bold text-sm">Her şey temiz!</p>
                                </div>
                            ) : (
                                pendingSnippets.map(snippet => (
                                    <button
                                        key={snippet.id}
                                        onClick={() => setSelectedSnippet(snippet)}
                                        className={`w-full p-4 rounded-xl text-left transition-all border group relative overflow-hidden ${selectedSnippet?.id === snippet.id
                                            ? 'bg-amber-500 border-amber-500 shadow-lg shadow-amber-500/25 z-10'
                                            : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1 relative z-10">
                                            <h3 className={`font-bold text-sm truncate pr-2 ${selectedSnippet?.id === snippet.id ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                                                {snippet.title}
                                            </h3>
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${selectedSnippet?.id === snippet.id ? 'bg-black/20 text-white/90' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                }`}>
                                                #{snippet.id}
                                            </span>
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs relative z-10 ${selectedSnippet?.id === snippet.id ? 'text-white/80' : 'text-slate-400'}`}>
                                            <User size={12} />
                                            <span className="truncate max-w-[120px]">{snippet.user?.name || snippet.user?.email}</span>
                                        </div>
                                        <div className={`mt-2 flex items-center gap-2 text-[10px] font-mono relative z-10 ${selectedSnippet?.id === snippet.id ? 'text-white/60' : 'text-slate-400'}`}>
                                            <span>{snippet.language?.name || 'Plain Text'}</span>
                                            <span>•</span>
                                            <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Context: Preview */}
                    <div className="flex-1 bg-slate-50/50 dark:bg-[#0b101a] flex flex-col min-w-0 relative">
                        {selectedSnippet ? (
                            <>
                                {/* Toolbar */}
                                <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                            <span className="text-xs font-black text-amber-500 uppercase">İnceleme Modu</span>
                                        </div>
                                        {selectedSnippet.externalUrl && (
                                            <a href={selectedSnippet.externalUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:underline">
                                                <ExternalLink size={12} />
                                                Source Control Link
                                            </a>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Source Control Push Actions */}
                                        <div className="mr-4 flex items-center gap-2 border-r border-slate-100 dark:border-slate-800 pr-4">
                                            <button
                                                onClick={() => handlePushToSourceControl('github')}
                                                disabled={pushing}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
                                                title="GitHub'a Gönder"
                                            >
                                                <Github size={18} />
                                            </button>
                                            <button
                                                onClick={() => handlePushToSourceControl('gitea')}
                                                disabled={pushing}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
                                                title="Gitea'ye Gönder"
                                            >
                                                <Server size={18} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => handleApproval(selectedSnippet.id, false)}
                                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                                        >
                                            <X size={16} /> Reddet
                                        </button>
                                        <button
                                            onClick={() => handleApproval(selectedSnippet.id, true)}
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white border border-transparent rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                                        >
                                            <Check size={16} /> Onayla
                                        </button>
                                    </div>
                                </div>

                                {/* Content Scroll */}
                                <div className="flex-1 overflow-y-auto p-8">
                                    <div className="max-w-4xl mx-auto space-y-6">

                                        {/* Meta Card */}
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{selectedSnippet.title}</h1>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                                {selectedSnippet.description || 'Açıklama girilmemiş.'}
                                            </p>

                                            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold border border-slate-200 dark:border-slate-700">
                                                        {selectedSnippet.user?.name?.[0] || <User size={18} />}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Yazar</div>
                                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedSnippet.user?.name || selectedSnippet.user?.email}</div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tarih</div>
                                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{new Date(selectedSnippet.createdAt).toLocaleDateString()}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Dil</div>
                                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedSnippet.language?.name || 'Metin'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Security Alert */}
                                        {selectedSnippet.isExecutable && (
                                            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl p-4 flex gap-4">
                                                <div className="shrink-0 w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center text-rose-500">
                                                    <AlertCircle size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-rose-700 dark:text-rose-400">Çalıştırılabilir Kod Uyarısı</h4>
                                                    <p className="text-sm text-rose-600/80 dark:text-rose-400/70 mt-1 font-medium">
                                                        Bu snippet sistemde doğrudan çalıştırılabilir olarak işaretlenmiş. Onaylamadan önce kötü amaçlı komutlar içermediğinden emin olun.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Code Block */}
                                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-[#1e1e1e] shadow-xl">
                                            <div className="bg-[#252526] px-4 py-2 border-b border-[#333] flex justify-between items-center">
                                                <span className="text-xs font-mono font-bold text-slate-400">main.{selectedSnippet.language?.monacoId || 'txt'}</span>
                                            </div>
                                            <div className="p-6 overflow-x-auto">
                                                <pre className="font-mono text-sm text-[#d4d4d4] leading-relaxed">
                                                    <code>{selectedSnippet.code}</code>
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center opacity-20">
                                    <Shield size={100} className="mx-auto mb-6" />
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">Onay Bekliyor</h3>
                                    <p className="text-xl font-bold mt-2">İşlem yapmak için soldan bir kayıt seçin</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </NavLayout>
    );
}
