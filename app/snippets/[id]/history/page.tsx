'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NavLayout from '@/components/NavLayout';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { ArrowLeft, History, Download, ChevronRight, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function VersionHistoryPage() {
    const { id } = useParams();
    const router = useRouter();
    const [versions, setVersions] = useState<any[]>([]);
    const [selectedVersions, setSelectedVersions] = useState<{old: any, new: any}>({old: null, new: null});

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
            <div className="flex h-[calc(100vh-64px)] bg-[var(--background)]">

                {/* SOL: Versiyon Listesi */}
                <aside className="w-80 border-r border-[var(--border-color)] overflow-y-auto bg-[var(--card-bg)]">
                    <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                            <ArrowLeft size={18} />
                        </button>
                        <h2 className="font-bold flex items-center gap-2 text-sm"><History size={16}/> Sürüm Geçmişi</h2>
                    </div>

                    <div className="p-2">
                        {versions.map((v, index) => (
                            <div
                                key={v.id}
                                onClick={() => setSelectedVersions(prev => ({ ...prev, new: v }))}
                                className={`p-4 mb-2 rounded-xl cursor-pointer border transition-all ${
                                    selectedVersions.new?.id === v.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${v.isMajor ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
                    v{v.major}.{v.minor}
                  </span>
                                    <span className="text-[10px] text-gray-400">
                    {format(new Date(v.createdAt), 'dd MMM HH:mm', { locale: tr })}
                  </span>
                                </div>
                                <h4 className="text-sm font-semibold truncate">{v.title}</h4>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedVersions(prev => ({ ...prev, old: v })); }}
                                        className="text-[10px] bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-300 transition-colors"
                                    >
                                        Karşılaştır (Baz Al)
                                    </button>
                                    <button onClick={() => handleDownload(v)} className="p-1 hover:text-blue-500"><Download size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* SAĞ: Diff Alanı */}
                <main className="flex-1 flex flex-col bg-white dark:bg-[#0d1117] overflow-hidden">
                    {selectedVersions.old && selectedVersions.new ? (
                        <>
                            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-xs">
                                        <span className="text-gray-400">Eski:</span> <b className="text-red-500">v{selectedVersions.old.major}.{selectedVersions.old.minor}</b>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-400" />
                                    <div className="text-xs">
                                        <span className="text-gray-400">Yeni:</span> <b className="text-green-500">v{selectedVersions.new.major}.{selectedVersions.new.minor}</b>
                                    </div>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700">
                                    <CheckCircle2 size={14}/> Bu Sürüme Dön
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto font-mono text-sm">
                                <ReactDiffViewer
                                    oldValue={selectedVersions.old.code}
                                    newValue={selectedVersions.new.code}
                                    splitView={true}
                                    useDarkTheme={true}
                                    leftTitle="Önceki Kod"
                                    rightTitle="Seçili Sürüm"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <History size={64} className="opacity-10 mb-4"/>
                            <p>Karşılaştırmak için bir sürüm seçin</p>
                        </div>
                    )}
                </main>
            </div>
        </NavLayout>
    );
}