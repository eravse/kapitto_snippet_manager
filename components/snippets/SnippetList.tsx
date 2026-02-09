'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import NavLayout from '@/components/NavLayout';
import {
    Search, Plus, Filter, MoreVertical, Edit, Trash2,
    Copy, History, Download, X, Crown, CheckSquare,
    Square, Trash, Check, Folder, View, RotateCcw,
    ChevronDown, ShieldCheck, Users, Heart, FolderOpen,
    ChevronLeft, ChevronRight, Layers
} from 'lucide-react';
import SnippetFormModal from '@/components/SnippetFormModal';
import Swal from 'sweetalert2';
import { SnippetWithRelations } from '@/lib/data/snippets';

interface SnippetListProps {
    initialSnippets: SnippetWithRelations[];
    totalPages: number;
    currentPage: number;
    searchParams: { [key: string]: string | undefined };
    isPro: boolean;
}

export default function SnippetList({
    initialSnippets,
    totalPages,
    currentPage,
    searchParams: initialSearchParams,
    isPro,
}: SnippetListProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === initialSnippets.length && initialSnippets.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(initialSnippets.map(s => s.id));
        }
    };

    const showProWarning = (feature: string) => {
        Swal.fire({
            title: 'Pro Özellik!',
            text: `${feature} özelliği sadece Pro lisans sahipleri içindir. Lütfen lisansınızı yükseltin.`,
            icon: 'info',
            confirmButtonText: 'Tamam',
            background: 'rgb(15, 23, 42)',
            color: '#fff',
            confirmButtonColor: '#f59e0b'
        });
    };

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Local state for UI interactions
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSnippet, setEditingSnippet] = useState<any | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedSnippetForExport, setSelectedSnippetForExport] = useState<number | null>(null);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [selectedSnippetForTeam, setSelectedSnippetForTeam] = useState<any>(null);
    const [userTeams, setUserTeams] = useState<any[]>([]);
    const [sharingLoading, setSharingLoading] = useState(false);

    useEffect(() => {
        if (isPro) {
            fetchUserTeams();
        }
    }, [isPro]);

    const fetchUserTeams = async () => {
        try {
            const res = await fetch('/api/teams');
            if (res.ok) {
                const data = await res.json();
                setUserTeams(data);
            }
        } catch (err) {
            console.error('Failed to fetch teams:', err);
        }
    };

    const handleShareWithTeam = async (teamId: number | null) => {
        if (!selectedSnippetForTeam) return;
        setSharingLoading(true);
        try {
            const response = await fetch(`/api/snippets/${selectedSnippetForTeam.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...selectedSnippetForTeam,
                    teamId: teamId,
                    // Pre-process tags because API expects tagIds array
                    tagIds: selectedSnippetForTeam.tags?.map((t: any) => t.tagId) || [],
                    languageId: selectedSnippetForTeam.languageId,
                    categoryId: selectedSnippetForTeam.categoryId,
                    folderId: selectedSnippetForTeam.folderId,
                }),
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı',
                    text: teamId ? 'Snippet takımla paylaşıldı.' : 'Snippet paylaşımı kaldırıldı.',
                    timer: 1500,
                    background: 'rgb(15, 23, 42)',
                    color: '#fff'
                });
                setIsTeamModalOpen(false);
                router.refresh();
            } else {
                throw new Error('Paylaşım başarısız.');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: 'İşlem sırasında bir hata oluştu.',
                background: 'rgb(15, 23, 42)',
                color: '#fff'
            });
        } finally {
            setSharingLoading(false);
        }
    };
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    // Handling search input state locally to debounce pushing to router
    const [searchQuery, setSearchQuery] = useState(initialSearchParams.search || '');
    const [isRegexSearch, setIsRegexSearch] = useState(false);

    // Helper to update URL params
    const updateParams = (updates: { [key: string]: string | null }) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSearch = (term: string) => {
        setSearchQuery(term);
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set('search', term);
        } else {
            params.delete('search');
        }
        if (isRegexSearch) {
            params.set('isRegex', 'true');
        } else {
            params.delete('isRegex');
        }
        params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`);
    };

    const toggleRegexSearch = () => {
        if (!isPro) {
            Swal.fire({
                icon: 'warning',
                title: 'Pro Özellik',
                html: 'Regex arama özelliği <strong>Pro</strong> sürümde mevcuttur.<br/><br/>Pro modülü ekleyerek bu özelliği kullanabilirsiniz.',
                background: 'rgb(17, 24, 39)',
                color: '#fff',
                confirmButtonColor: '#3b82f6',
                confirmButtonText: 'Anladım'
            });
            return;
        }
        setIsRegexSearch(!isRegexSearch);
        // Re-trigger search with new regex mode
        if (searchQuery) {
            const params = new URLSearchParams(searchParams.toString());
            if (!isRegexSearch) {
                params.set('isRegex', 'true');
            } else {
                params.delete('isRegex');
            }
            router.replace(`${pathname}?${params.toString()}`);
        }
    };

    const handlePageChange = (newPage: number) => {
        updateParams({ page: newPage.toString() });
    };

    const clearCategoryFilter = () => {
        updateParams({ categoryId: null, page: '1' });
    };

    // --- Action Handlers ---
    const handleEdit = (snippet: SnippetWithRelations) => {
        setEditingSnippet(snippet);
        setIsModalOpen(true);
        setActiveMenu(null);
    };

    const handleDelete = async (id: number) => {
        setActiveMenu(null);
        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: "Bu işlem geri alınamaz!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal',
            background: 'rgb(17, 24, 39)',
            color: '#fff'
        });

        if (result.isConfirmed) {
            const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' });
            if (res.ok) {
                Swal.fire('Silindi!', 'Snippet başarıyla silindi.', 'success');
                router.refresh();
            }
        }
    };

    const handleDuplicate = async (id: number) => {
        setActiveMenu(null);

        if (!isPro) {
            Swal.fire({
                icon: 'warning',
                title: 'Pro Özellik',
                html: 'Snippet kopyalama özelliği <strong>Pro</strong> sürümde mevcuttur.<br/><br/>Pro modülü ekleyerek bu özelliği kullanabilirsiniz.',
                background: 'rgb(17, 24, 39)',
                color: '#fff',
                confirmButtonColor: '#3b82f6',
                confirmButtonText: 'Anladım'
            });
            return;
        }

        try {
            const response = await fetch(`/api/snippets/${id}/duplicate`, {
                method: 'POST',
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: 'Snippet kopyası oluşturuldu.',
                    timer: 1500,
                    background: 'rgb(17, 24, 39)',
                    color: '#fff'
                });
                router.refresh();
            } else {
                throw new Error('Kopyalama başarısız');
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: 'Kopyalama işlemi sırasında bir hata oluştu.',
                background: 'rgb(17, 24, 39)',
                color: '#fff'
            });
        }
    };

    const handleVersionHistory = (snippetId: number) => {
        setActiveMenu(null);

        if (!isPro) {
            Swal.fire({
                icon: 'warning',
                title: 'Pro Özellik',
                html: 'Versiyon geçmişi özelliği <strong>Pro</strong> sürümde mevcuttur.<br/><br/>Pro modülü ekleyerek bu özelliği kullanabilirsiniz.',
                background: 'rgb(17, 24, 39)',
                color: '#fff',
                confirmButtonColor: '#3b82f6',
                confirmButtonText: 'Anladım'
            });
            return;
        }

        router.push(`/snippets/${snippetId}/history`);
    };

    const handleBulkDelete = async () => {
        if (!isPro) {
            showProWarning('Toplu Silme');
            return;
        }

        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: `${selectedIds.length} adet snippet kalıcı olarak silinecektir!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Evet, Sil!',
            cancelButtonText: 'Vazgeç',
            background: 'rgb(15, 23, 42)',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                Swal.fire({
                    title: 'Siliniyor...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                    background: 'rgb(15, 23, 42)',
                    color: '#fff'
                });

                const response = await fetch('/api/snippets/bulk', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ snippetIds: selectedIds }),
                });

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Başarılı',
                        text: 'Seçili snippet\'ler başarıyla silindi.',
                        timer: 1500,
                        background: 'rgb(15, 23, 42)',
                        color: '#fff'
                    });
                    setSelectedIds([]);
                    router.refresh();
                } else {
                    throw new Error('Silme işlemi başarısız.');
                }
            } catch (error) {
                console.error(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Hata',
                    text: 'İşlem sırasında bir hata oluştu.',
                    background: 'rgb(15, 23, 42)',
                    color: '#fff'
                });
            }
        }
    };

    const handleExport = async (id: number, format: 'json' | 'md' | 'pdf') => {
        setActiveMenu(null);

        if (!isPro) {
            showProWarning('Dışa Aktırma');
            return;
        }

        try {
            Swal.fire({
                title: 'Hazırlanıyor...',
                text: 'Dışa aktırma işlemi başlatıldı.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
                background: 'rgb(15, 23, 42)',
                color: '#fff'
            });

            // If id is 0, we are doing bulk export
            if (id === 0) {
                const response = await fetch('/api/snippets/export/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ snippetIds: selectedIds, format }),
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const timestamp = new Date().getTime();
                    a.download = `kapitto_bulk_export_${format}_${timestamp}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    Swal.close();
                } else {
                    throw new Error('Toplu dışa aktarma başarısız.');
                }
            } else {
                // Single export
                const response = await fetch(`/api/snippets/${id}/export?format=${format}`);

                if (response.ok) {
                    if (format === 'pdf') {
                        // For PDF/HTML, open in new window
                        const html = await response.text();
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                            printWindow.document.write(html);
                            printWindow.document.close();
                        }
                    } else {
                        // For JSON and MD, download
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        const filename = format === 'json' ? `snippet_${id}.json` : `snippet_${id}.md`;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                    }
                    Swal.close();
                } else {
                    throw new Error('Dışa aktarma başarısız.');
                }
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: 'İşlem sırasında bir hata oluştu.',
                background: 'rgb(15, 23, 42)',
                color: '#fff'
            });
        }
    };

    const handleBulkExport = (format: 'json' | 'md' | 'pdf') => {
        handleExport(0, format);
    };

    const renderTableBody = () => {
        if (initialSnippets.length === 0) {
            return (
                <tr>
                    <td colSpan={7} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center max-w-sm mx-auto p-8 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-700">
                            <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
                                <Search size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Henüz Bir Şey Yok</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Aradığınız kriterlere uygun herhangi bir snippet bulunamadı.</p>
                            <button
                                onClick={() => { setSearchQuery(''); handleSearch(''); }}
                                className="mt-6 text-sm font-black text-amber-600 hover:text-amber-700 dark:text-amber-400 underline underline-offset-4 decoration-2 transition-all"
                            >
                                Tüm Arama Filtrelerini Temizle
                            </button>
                        </div>
                    </td>
                </tr>
            );
        }

        return initialSnippets.map((snippet) => {
            const latest = (Array.isArray(snippet.versions) && snippet.versions.length > 0)
                ? snippet.versions[0]
                : { major: 1, minor: 0 };
            const isMenuOpen = activeMenu === snippet.id;

            return (
                <tr
                    key={snippet.id}
                    className={`group transition-all duration-200 ${isMenuOpen ? 'bg-slate-50/80 dark:bg-slate-900/40' : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/40'}`}
                    style={{ position: 'relative', zIndex: isMenuOpen ? 50 : 'auto' }}
                >
                    <td className="px-6 py-4">
                        <button
                            onClick={() => toggleSelect(snippet.id)}
                            className="p-1 rounded-xl text-slate-400 hover:text-amber-500 transition-colors"
                        >
                            {selectedIds.includes(snippet.id)
                                ? <CheckSquare size={20} className="text-amber-500" />
                                : <Square size={20} />
                            }
                        </button>
                    </td>
                    <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 uppercase tracking-tighter">
                            v{latest.major}.{latest.minor}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col max-w-xs group/title">
                            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 truncate group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors">
                                {snippet.title}
                                {snippet.teamId && (
                                    <span title={`Paylaşılan Takım: ${snippet.team?.name || 'Takım'}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-black uppercase tracking-tight">
                                        <Users size={10} />
                                        {(snippet as any).team?.name || 'TAKIM'}
                                    </span>
                                )}
                                {snippet.isFavorite && (
                                    <div className="relative">
                                        <Heart size={14} className="text-pink-500 fill-pink-500 animate-pulse" />
                                        <div className="absolute inset-0 bg-pink-400 blur-sm opacity-20 animate-ping"></div>
                                    </div>
                                )}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 truncate mt-1 line-clamp-1">{snippet.description || 'Açıklama belirtilmemiş'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 transition-all hover:bg-white dark:hover:bg-slate-600">
                                {snippet.language?.icon && <span className="text-base leading-none">{snippet.language.icon}</span>}
                                {snippet.language?.name || 'Unknown'}
                            </span>
                            {snippet.category && (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all hover:shadow-sm`}
                                    style={{
                                        backgroundColor: `${snippet.category.color}15`,
                                        color: snippet.category.color || undefined,
                                        borderColor: `${snippet.category.color}40`
                                    }}>
                                    {snippet.category.icon && <span className="mr-1.5 opacity-80">{snippet.category.icon}</span>}
                                    {snippet.category.name}
                                </span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        {snippet.folder ? (
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center border border-amber-100 dark:border-amber-800">
                                    <FolderOpen size={12} className="text-amber-500" />
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{snippet.folder.name}</span>
                            </div>
                        ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                            <span className="text-sm font-black text-slate-700 dark:text-slate-200 tabular-nums tracking-tighter">
                                {snippet.viewCount}
                            </span>
                            <div className="w-8 h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (snippet.viewCount / 100) * 100)}%` }}></div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => handleEdit(snippet)}
                                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-600 text-slate-400 hover:text-blue-500 transition-all shadow-none hover:shadow-lg"
                                title="Düzenle"
                            >
                                <Edit size={18} />
                            </button>

                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const spaceBelow = window.innerHeight - rect.bottom;
                                        const openUp = spaceBelow < 400; // If less than 400px below, open up
                                        setActiveMenu(isMenuOpen ? null : snippet.id);
                                        // We can store the direction in state if we want or just use a dynamic class
                                    }}
                                    className={`p-2 rounded-xl border transition-all shadow-none hover:shadow-lg ${isMenuOpen
                                        ? 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-amber-500 shadow-xl'
                                        : 'text-slate-400 hover:bg-white dark:hover:bg-slate-700 border-transparent hover:border-slate-200 dark:border-slate-600'
                                        }`}
                                >
                                    <MoreVertical size={18} />
                                </button>

                                {isMenuOpen && (
                                    <>
                                        <div className="fixed inset-0" style={{ zIndex: 140 }} onClick={() => setActiveMenu(null)}></div>
                                        <div
                                            className={`absolute right-0 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[151] ${
                                                // Dynamic positioning based on screen space
                                                (() => {
                                                    const btn = document.querySelector(`button[onClick*="${snippet.id}"]`); // rough selector
                                                    // Since we are inside the map, we can't easily check rect here without refs.
                                                    // But we can approximate based on index or use a simple heuristic.
                                                    // For now, let's use a class that we can trigger.
                                                    return "mt-3 origin-top-right";
                                                })()
                                                }`}
                                            style={{
                                                // If it's one of the last few items, open upwards
                                                bottom: initialSnippets.indexOf(snippet) > initialSnippets.length - 4 ? 'calc(100% + 12px)' : 'auto',
                                                top: initialSnippets.indexOf(snippet) > initialSnippets.length - 4 ? 'auto' : '100%',
                                                transformOrigin: initialSnippets.indexOf(snippet) > initialSnippets.length - 4 ? 'bottom right' : 'top right'
                                            }}
                                        >
                                            <div className="p-2 space-y-1">
                                                <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-700 mb-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hızlı İşlemler</span>
                                                </div>
                                                <MenuButton
                                                    onClick={() => handleVersionHistory(snippet.id)}
                                                    icon={<History size={18} />}
                                                    label="Versiyon Geçmişi"
                                                    color="text-indigo-600 dark:text-indigo-400"
                                                    isPro={!isPro}
                                                />
                                                <MenuButton
                                                    onClick={() => {
                                                        setSelectedSnippetForTeam(snippet);
                                                        setIsTeamModalOpen(true);
                                                        setActiveMenu(null);
                                                    }}
                                                    icon={<Users size={18} />}
                                                    label={snippet.teamId ? "Takım Paylaşımını Düzenle" : "Takımla Paylaş"}
                                                    color="text-amber-600 dark:text-amber-400"
                                                    isPro={!isPro}
                                                />
                                                <MenuButton
                                                    onClick={() => handleDuplicate(snippet.id)}
                                                    icon={<Copy size={18} />}
                                                    label="Kopyasını Oluştur"
                                                    color="text-emerald-600 dark:text-emerald-400"
                                                    isPro={!isPro}
                                                />

                                                <div className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-2"></div>

                                                <div className="px-3 py-2">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                            <Download size={12} /> Dışa Aktar
                                                        </span>
                                                        {!isPro && (
                                                            <span className="flex items-center gap-1 text-[9px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                                <Crown size={10} /> PRO
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => handleExport(snippet.id, 'json')}
                                                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 transition-all active:scale-95 group/btn"
                                                        >
                                                            <span className="text-[10px] font-black text-slate-400 group-hover/btn:text-blue-500 transition-colors uppercase">JSON</span>
                                                            <span className="text-xs font-bold mt-1">Export</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleExport(snippet.id, 'md')}
                                                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 transition-all active:scale-95 group/btn"
                                                        >
                                                            <span className="text-[10px] font-black text-slate-400 group-hover/btn:text-blue-500 transition-colors uppercase">MD</span>
                                                            <span className="text-xs font-bold mt-1">Archive</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleExport(snippet.id, 'pdf')}
                                                            className="col-span-2 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 transition-all active:scale-95 group/btn"
                                                        >
                                                            <span className="text-xs font-bold">PDF Olarak Yazdır</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-2"></div>
                                                <MenuButton
                                                    onClick={() => handleDelete(snippet.id)}
                                                    icon={<Trash2 size={18} />}
                                                    label="Kalıcı Olarak Sil"
                                                    color="text-rose-600 dark:text-rose-400"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </td>
                </tr>
            );
        });
    };

    return (
        <NavLayout>
            <div className="mx-auto p-4 md:p-8">
                {/* Modern Header with Gradient */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-1 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full"></div>
                            <div className="p-2.5 bg-orange-600 rounded-xl shadow-xl shadow-orange-500/30">
                                <Layers className="text-white" size={28} />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                                <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
                                    Snippet Arşivi
                                </span>
                            </h1>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-base font-medium ml-4 flex items-center gap-2">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Kod parçacıklarınızı yönetin ve organize edin
                        </p>
                    </div>
                    <button
                        onClick={() => { setEditingSnippet(null); setIsModalOpen(true); }}
                        className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 active:scale-95 font-black text-sm relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <Plus size={20} className="relative z-10 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="relative z-10">Yeni Snippet</span>
                    </button>
                </div>

                {/* Modern Search & Search Bar - Audit Log Style */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 mb-8 shadow-sm transition-all">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-all duration-300">
                                <Search size={20} />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder={isRegexSearch ? "Regex pattern (örn: ^function.*)" : "Hemen bul: Snippet başlığı, dil veya açıklama..."}
                                className="w-full pl-12 pr-6 py-3.5 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/50 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 outline-none transition-all duration-300 text-sm font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            />
                        </div>

                        {/* Regex Toggle - Audit Log Style */}
                        <button
                            onClick={toggleRegexSearch}
                            className={`group flex items-center gap-3 px-5 py-3.5 rounded-xl border transition-all duration-300 ${isRegexSearch
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-800'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${isRegexSearch ? 'bg-white animate-pulse' : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-400'} transition-colors`}></div>
                            <span className="text-xs font-black uppercase tracking-widest">Regex Modu</span>
                            {!isPro && (
                                <span className="flex items-center gap-1 text-[9px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                                    <Crown size={10} />
                                </span>
                            )}
                        </button>

                        {initialSearchParams.categoryId && (
                            <div className="flex items-center gap-3 bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-5 py-3.5 rounded-xl border border-blue-100/50 dark:border-blue-500/20 animate-in zoom-in-95 shadow-sm">
                                <Filter size={16} className="text-blue-500" />
                                <span className="text-xs font-black uppercase tracking-widest truncate max-w-[150px]">
                                    {initialSnippets[0]?.category?.name || 'Kategori'}
                                </span>
                                <button onClick={() => {
                                    const params = new URLSearchParams(initialSearchParams as any);
                                    params.delete('categoryId');
                                    router.push(`?${params.toString()}`);
                                }} className="ml-2 p-1.5 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl transition-all hover:rotate-90">
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {initialSearchParams.teamId && (
                            <div className="flex items-center gap-3 bg-amber-50/80 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-5 py-3.5 rounded-xl border border-amber-100/50 dark:border-amber-500/20 animate-in zoom-in-95 shadow-sm">
                                <Users size={16} className="text-amber-500" />
                                <span className="text-xs font-black uppercase tracking-widest truncate max-w-[150px]">
                                    {(initialSnippets.find(s => s.teamId === parseInt(initialSearchParams.teamId!)) as any)?.team?.name || 'Takım'}
                                </span>
                                <button onClick={() => {
                                    const params = new URLSearchParams(initialSearchParams as any);
                                    params.delete('teamId');
                                    router.push(`?${params.toString()}`);
                                }} className="ml-2 p-1.5 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-xl transition-all hover:rotate-90">
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modern Table Card - Audit Log Style */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto overflow-y-visible">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700">
                                    <th className="px-6 py-5 w-10">
                                        <button
                                            onClick={toggleSelectAll}
                                            className="p-1 rounded-xl text-slate-400 hover:text-amber-500 transition-colors"
                                        >
                                            {selectedIds.length === initialSnippets.length && initialSnippets.length > 0
                                                ? <CheckSquare size={20} className="text-amber-500" />
                                                : <Square size={20} />
                                            }
                                        </button>
                                    </th>
                                    <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Versiyon</th>
                                    <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Başlık</th>
                                    <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Dil & Kategori</th>
                                    <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Klasör</th>
                                    <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">İzlenme</th>
                                    <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                {renderTableBody()}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            Sayfa <span className="text-slate-900 dark:text-white px-1.5">{currentPage}</span> / {totalPages}
                        </span>
                        <div className="flex items-center gap-3">
                            <PaginationButton
                                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                icon={<ChevronLeft size={18} />}
                            />
                            <PaginationButton
                                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                icon={<ChevronRight size={18} />}
                            />
                        </div>
                    </div>
                </div>

                {/* Bulk Action Toolbar - Audit Log Style */}
                {selectedIds.length > 0 && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 h-auto">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 flex items-center gap-6 text-white min-w-[500px]">
                            <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
                                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-900 font-black">
                                    {selectedIds.length}
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest">Snippet Seçildi</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleBulkExport('json')}
                                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-xl transition-all text-xs font-bold"
                                >
                                    <Download size={14} className="text-amber-500" /> JSON
                                </button>
                                <button
                                    onClick={() => handleBulkExport('md')}
                                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-xl transition-all text-xs font-bold"
                                >
                                    <Download size={14} className="text-amber-500" /> Markdown
                                </button>
                                <button
                                    onClick={() => handleBulkExport('pdf')}
                                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-xl transition-all text-xs font-bold"
                                >
                                    <Download size={14} className="text-amber-500" /> PDF (HTML)
                                </button>
                            </div>

                            <div className="h-8 w-px bg-slate-700 mx-2 hidden md:block"></div>

                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all text-xs font-black uppercase tracking-widest border border-rose-500/20"
                            >
                                <Trash2 size={14} /> Seçilenleri Sil
                            </button>

                            <button
                                onClick={() => setSelectedIds([])}
                                className="ml-auto p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
                                title="Seçimi Temizle"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <SnippetFormModal
                isOpen={isModalOpen}
                onClose={(refresh) => {
                    setIsModalOpen(false);
                    setEditingSnippet(null);
                    if (refresh) router.refresh();
                }}
                snippet={editingSnippet}
                defaultCategoryId={initialSearchParams.categoryId}
            />

            {/* Team Sharing Modal */}
            {isTeamModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                        <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-50 dark:border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                                    <Users size={24} />
                                </div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                                    Takımla Paylaş
                                </h2>
                            </div>
                            <button onClick={() => setIsTeamModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all text-slate-400">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Bu snippet'ı bir ekiple paylaşarak diğer üyelerin de görmesini ve kullanmasını sağlayabilirsiniz.
                            </p>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ekip Seçin</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {userTeams.length > 0 ? (
                                        userTeams.map((team) => (
                                            <button
                                                key={team.id}
                                                onClick={() => handleShareWithTeam(team.id)}
                                                disabled={sharingLoading}
                                                className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${selectedSnippetForTeam?.teamId === team.id
                                                    ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                                                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700 hover:border-amber-500/50 text-slate-700 dark:text-slate-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${selectedSnippetForTeam?.teamId === team.id ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-800'
                                                        }`}>
                                                        {team.name[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm">{team.name}</div>
                                                        <div className={`text-[10px] ${selectedSnippetForTeam?.teamId === team.id ? 'text-white/70' : 'text-slate-500'}`}>
                                                            {team._count?.members || 0} Üye
                                                        </div>
                                                    </div>
                                                </div>
                                                {selectedSnippetForTeam?.teamId === team.id && (
                                                    <ShieldCheck size={18} />
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                            <p className="text-xs font-bold text-slate-500">Henüz bir takımınız yok.</p>
                                        </div>
                                    )}

                                    {selectedSnippetForTeam?.teamId && (
                                        <button
                                            onClick={() => handleShareWithTeam(null)}
                                            disabled={sharingLoading}
                                            className="w-full mt-4 py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                        >
                                            Paylaşımı Kaldır
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </NavLayout>
    );
}

function MenuButton({ onClick, icon, label, color, isPro }: { onClick: () => void, icon: React.ReactNode, label: string, color: string, isPro?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`group w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 active:scale-95 ${color} ${isPro
                ? 'hover:bg-amber-50 dark:hover:bg-amber-900/10 border border-transparent hover:border-amber-100 dark:hover:border-amber-900/20'
                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-xl bg-current bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                <span className="tracking-tight">{label}</span>
            </div>
            {isPro && (
                <span className="inline-flex items-center gap-1 text-[9px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm ring-1 ring-white/20">
                    <Crown size={10} /> PRO
                </span>
            )}
        </button>
    );
}

function PaginationButton({ onClick, disabled, icon }: { onClick: () => void, disabled: boolean, icon: React.ReactNode }) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className="group p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all text-slate-400 hover:text-amber-500 shadow-none hover:shadow-lg active:scale-90"
        >
            <div className="group-hover:scale-110 transition-transform">
                {icon}
            </div>
        </button>
    );
}
