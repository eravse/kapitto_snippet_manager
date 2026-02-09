'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NavLayout from '@/components/NavLayout';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { ArrowLeft, History, Download, ChevronRight, CheckCircle2, LayoutGrid, Menu, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function VersionHistoryPage() {
    const { id } = useParams();
    const router = useRouter();
    const [versions, setVersions] = useState<any[]>([]);
    const [selectedVersions, setSelectedVersions] = useState<{ old: any, new: any }>({ old: null, new: null });
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        fetch(`/api/snippets/${id}/versions`)
            .then(res => res.json())
            .then(data => {
                setVersions(data);
                if (data.length >= 2) {
                    setSelectedVersions({ old: data[1], new: data[0] });
                }
            });
    }, [id]);

    const handleDownload = (v: any) => {
        const blob = new Blob([v.code], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `v${v.major}.${v.minor}_${v.title}.txt`;
        a.click();
    };

    return (
        <NavLayout>
            <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-slate-50 dark:bg-[#020617] overflow-hidden">

                {/* Responsive Sidebar */}
                <aside
                    className={`${isSidebarOpen ? 'w-full lg:w-80' : 'w-0 overflow-hidden lg:w-0'
                        } border-r border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 transition-all duration-300 relative flex flex-col z-40`}
                >
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <div className="flex flex-col">
                                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={16} className="text-amber-500" /> Geçmiş
                                </h2>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Versiyon Listesi</span>
                            </div>
                        </div>
                        {isMobile && (
                            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {versions.map((v) => (
                            <div
                                key={v.id}
                                onClick={() => {
                                    setSelectedVersions(prev => ({ ...prev, new: v }));
                                    if (isMobile) setIsSidebarOpen(false);
                                }}
                                className={`p-4 rounded-xl cursor-pointer border transition-all duration-300 group relative overflow-hidden ${selectedVersions.new?.id === v.id
                                    ? 'border-amber-500/50 bg-amber-50/10 dark:bg-amber-500/5 shadow-lg shadow-amber-500/5'
                                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                {selectedVersions.new?.id === v.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                                )}

                                <div className="flex justify-between items-center mb-2">
                                    <span className={`px-2 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${v.isMajor
                                        ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                        }`}>
                                        v{v.major}.{v.minor}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                                        {format(new Date(v.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                                    </span>
                                </div>
                                <h4 className={`text-xs font-black truncate transition-colors ${selectedVersions.new?.id === v.id ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                    {v.title}
                                </h4>

                                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedVersions(prev => ({ ...prev, old: v })); }}
                                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all ${selectedVersions.old?.id === v.id
                                            ? 'bg-amber-500 text-white border-amber-600'
                                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-500'
                                            }`}
                                    >
                                        Baza Al
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDownload(v); }}
                                        className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all"
                                        title="İndir"
                                    >
                                        <Download size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-w-0 relative">
                    {/* Floating Sidebar Toggle (Mobile) */}
                    {isMobile && !isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="fixed left-4 bottom-4 z-50 p-4 bg-amber-500 text-white rounded-xl shadow-2xl hover:bg-amber-600 transition-all active:scale-90"
                        >
                            <Menu size={24} />
                        </button>
                    )}

                    {selectedVersions.old && selectedVersions.new ? (
                        <>
                            <header className="p-4 lg:p-6 border-b border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Karşılaştırma Modu</span>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-900/20">
                                                <span className="text-[9px] font-black text-red-400 uppercase">Eski</span>
                                                <b className="text-xs font-black text-red-600 dark:text-red-400">v{selectedVersions.old.major}.{selectedVersions.old.minor}</b>
                                            </div>
                                            <ChevronRight size={18} className="text-slate-300 dark:text-slate-700" />
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-500/5 border border-green-100 dark:border-green-900/20">
                                                <span className="text-[9px] font-black text-green-400 uppercase">Yeni</span>
                                                <b className="text-xs font-black text-green-600 dark:text-green-400">v{selectedVersions.new.major}.{selectedVersions.new.minor}</b>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hidden xl:flex flex-col border-l border-slate-200 dark:border-slate-800 pl-6">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Seçili Sürüm Başlığı</span>
                                        <h1 className="text-sm font-black text-slate-800 dark:text-slate-200 truncate max-w-[300px]">
                                            {selectedVersions.new.title}
                                        </h1>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button className="flex items-center justify-center gap-2.5 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 active:scale-95 uppercase tracking-widest group">
                                        <CheckCircle2 size={16} className="group-hover:scale-110 transition-transform" />
                                        <span>Geri Yükle</span>
                                    </button>
                                </div>
                            </header>

                            <div className="flex-1 overflow-auto bg-white dark:bg-[#020617] p-2 lg:p-4">
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-[#0d1117]">
                                    <ReactDiffViewer
                                        oldValue={selectedVersions.old.code}
                                        newValue={selectedVersions.new.code}
                                        splitView={!isMobile}
                                        useDarkTheme={true}
                                        styles={{
                                            variables: {
                                                dark: {
                                                    diffViewerBackground: '#0d1117',
                                                    diffViewerColor: '#c9d1d9',
                                                    addedBackground: '#1f6feb25',
                                                    addedColor: '#58a6ff',
                                                    removedBackground: '#da363325',
                                                    removedColor: '#f85149',
                                                    wordAddedBackground: '#1f6feb50',
                                                    wordRemovedBackground: '#da363350',
                                                    addedGutterBackground: '#1f6feb30',
                                                    removedGutterBackground: '#da363330',
                                                    gutterColor: '#484f58',
                                                    codeFoldGutterBackground: '#21262d',
                                                    codeFoldBackground: '#161b22',
                                                    emptyLineBackground: '#0d1117',
                                                    diffViewerTitleBackground: '#161b22',
                                                    diffViewerTitleColor: '#8b949e',
                                                    diffViewerTitleBorderColor: '#30363d',
                                                }
                                            },
                                            content: {
                                                fontSize: '13px',
                                                lineHeight: '1.6',
                                                fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                                            },
                                            gutter: {
                                                padding: '0 12px',
                                                minWidth: '50px',
                                            }
                                        }}
                                        leftTitle={`v${selectedVersions.old.major}.${selectedVersions.old.minor} - ESKİ`}
                                        rightTitle={`v${selectedVersions.new.major}.${selectedVersions.new.minor} - YENİ`}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
                            <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                                <History size={48} className="text-slate-300 dark:text-slate-700" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 mb-2">Karşılaştırma Hazır</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                                Sol taraftaki listeden iki farklı sürüm seçerek aralarındaki farkları detaylıca inceleyebilirsiniz.
                            </p>
                            {!isSidebarOpen && isMobile && (
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="mt-6 flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    Sürüm Listesini Aç
                                </button>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </NavLayout>
    );
}