'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation'; // useSearchParams eklendi
import NavLayout from '@/components/NavLayout';
import {
  Plus, Search, Edit, Trash2, Eye, Heart, FolderOpen,
  Copy, Download, History, MoreVertical, Loader2, X, Filter
} from 'lucide-react';
import SnippetFormModal from '@/components/SnippetFormModal';
import Swal from 'sweetalert2';

// --- Arayüz Tanımlamaları ---
// (Mevcut interface yapıların aynen korunuyor)
interface Version { id: number; major: number; minor: number; isMajor: boolean; code: string; }
interface Snippet {
  id: number;
  title: string;
  description?: string;
  code: string;
  category?: { id: number; name: string; icon?: string };
  language?: { id: number; name: string };
  folder?: { id: number; name: string };
  isFavorite: boolean;
  viewCount: number;
  createdAt: string;
  versions: Version[];
}

export default function SnippetsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL'den categoryId'yi al
  const categoryIdParam = searchParams.get('categoryId');

  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loadingSnippets, setLoadingSnippets] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);

  const loadSnippets = useCallback(async () => {
    if (!user) return;
    setLoadingSnippets(true);
    try {
      // API isteğine categoryId parametresini ekle
      let url = `/api/snippets?page=${currentPage}&limit=10${
          searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
      }`;

      if (categoryIdParam) {
        url += `&categoryId=${categoryIdParam}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      setSnippets(data.snippets || (Array.isArray(data) ? data : []));
      setTotalPages(data.totalPages || 1);

      // Eğer bir kategori filtresi varsa ve listede snippet geldiyse, kategori adını set et
      if (categoryIdParam && data.snippets?.length > 0) {
        setCategoryName(data.snippets[0].category?.name || 'Kategori');
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoadingSnippets(false);
    }
  }, [currentPage, searchQuery, user, categoryIdParam]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      const timer = setTimeout(() => { loadSnippets(); }, 400);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, router, loadSnippets]);

  // Filtreyi temizleme fonksiyonu
  const clearCategoryFilter = () => {
    setCategoryName(null);
    router.push('/snippets'); // Parametresiz URL'e dön
  };

  const handleEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet);
    setIsModalOpen(true);
    setActiveMenu(null);
  };

  // ... (handleDownloadLastMajor, handleDuplicate, handleDelete fonksiyonları aynı kalıyor)
  const handleDownloadLastMajor = (snippet: Snippet) => {
    const versionsList = snippet.versions || [];
    const lastMajor = [...versionsList].filter(v => v.isMajor).sort((a, b) => b.major - a.major)[0];
    const content = lastMajor ? lastMajor.code : snippet.code;
    const versionLabel = lastMajor ? `v${lastMajor.major}.0` : 'v1.0';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${snippet.title.replace(/\s+/g, '_')}_${versionLabel}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    setActiveMenu(null);
  };

  const handleDuplicate = async (id: number) => {
    setActiveMenu(null);
    try {
      const response = await fetch(`/api/snippets/${id}/duplicate`, { method: 'POST' });
      if (response.ok) {
        Swal.fire({ icon: 'success', title: 'Kopyalandı!', timer: 1000, showConfirmButton: false });
        loadSnippets();
      }
    } catch (error) {
      Swal.fire('Hata!', 'Snippet kopyalanamadı.', 'error');
    }
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
      background: 'var(--card-bg)',
      color: 'var(--foreground)'
    });

    if (result.isConfirmed) {
      const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        Swal.fire('Silindi!', 'Snippet başarıyla silindi.', 'success');
        loadSnippets();
      }
    }
  };

  const renderTableBody = () => {
    if (loadingSnippets) {
      return (
          <tr>
            <td colSpan={6} className="px-6 py-12 text-center text-blue-500">
              <div className="flex items-center justify-center gap-2 font-medium">
                <Loader2 className="animate-spin" size={24} /> Yükleniyor...
              </div>
            </td>
          </tr>
      );
    }

    if (snippets.length === 0) {
      return (
          <tr>
            <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic font-medium">
              Snippet bulunamadı.
            </td>
          </tr>
      );
    }

    return snippets.map((snippet) => {
      const latest = (Array.isArray(snippet.versions) && snippet.versions.length > 0)
          ? snippet.versions[0]
          : { major: 1, minor: 0 };
      const isMenuOpen = activeMenu === snippet.id;

      return (
          <tr key={snippet.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors relative ${isMenuOpen ? 'z-[100]' : 'z-0'}`}>
            <td className="px-6 py-4">
              <span className="font-mono text-blue-500 font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-800 text-xs">
                v{latest.major}.{latest.minor}
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex flex-col">
                <span className="font-bold flex items-center gap-2 text-[var(--foreground)]">
                  {snippet.title}
                  {snippet.isFavorite && <Heart size={14} className="text-red-500 fill-red-500" />}
                </span>
                <span className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">{snippet.description || 'Açıklama yok'}</span>
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm text-[var(--foreground)]">{snippet.language?.name || '-'}</span>
                <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded w-fit uppercase font-bold text-gray-500">
                  {snippet.category?.name || 'Genel'}
                </span>
              </div>
            </td>
            <td className="px-6 py-4">
              {snippet.folder ? (
                  <span className="flex items-center gap-1.5 text-gray-500 text-xs italic">
                    <FolderOpen size={14} /> {snippet.folder.name}
                  </span>
              ) : <span className="text-gray-300">-</span>}
            </td>
            <td className="px-6 py-4 text-center text-gray-400">
              <div className="flex items-center justify-center gap-1 text-xs">
                <Eye size={14} /> {snippet.viewCount}
              </div>
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => handleEdit(snippet)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg transition-colors">
                  <Edit size={18} />
                </button>
                <div className="relative">
                  <button onClick={() => setActiveMenu(isMenuOpen ? null : snippet.id)} className={`p-2 rounded-lg transition-all ${isMenuOpen ? 'bg-gray-200 dark:bg-gray-700 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                    <MoreVertical size={18} />
                  </button>
                  {isMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-[110]" onClick={() => setActiveMenu(null)}></div>
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[120] overflow-hidden text-left origin-top-right animate-in fade-in zoom-in-95 duration-100">
                          <div className="p-1.5 space-y-0.5">
                            <button onClick={() => { router.push(`/snippets/${snippet.id}/history`); setActiveMenu(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors">
                              <History size={16} /> Versiyon Geçmişi
                            </button>
                            <button onClick={() => handleDownloadLastMajor(snippet)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                              <Download size={16} /> Versiyon İndir (.txt)
                            </button>
                            <button onClick={() => handleDuplicate(snippet.id)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                              <Copy size={16} /> Kopyasını Oluştur
                            </button>
                            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
                            <button onClick={() => handleDelete(snippet.id)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                              <Trash2 size={16} /> Kalıcı Olarak Sil
                            </button>
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

  if (authLoading || !user) return null;

  return (
      <NavLayout>
        <div className="p-6 mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">Snippet Yönetimi</h1>
              {categoryIdParam && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <Filter size={14} /> Filtrelenmiş sonuçlar gösteriliyor
                  </p>
              )}
            </div>
            <button onClick={() => { setEditingSnippet(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all font-semibold">
              <Plus size={20} /> Yeni Snippet
            </button>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Başlık, dil veya kategori ara..."
                  className="w-full pl-11 pr-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[var(--foreground)]"
              />
            </div>

            {/* Kategori Filtresi Aktifse Gösterilen Badge */}
            {categoryIdParam && (
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-2 rounded-lg border border-blue-100 dark:border-blue-800 transition-all animate-in fade-in slide-in-from-right-2">
                <span className="text-sm font-bold truncate max-w-[150px]">
                  Kategori: {categoryName || '...'}
                </span>
                  <button
                      onClick={clearCategoryFilter}
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full transition-colors"
                      title="Filtreyi Temizle"
                  >
                    <X size={14} />
                  </button>
                </div>
            )}
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left border-separate border-spacing-0">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-4 rounded-tl-xl border-b border-[var(--border-color)]">Versiyon</th>
                  <th className="px-6 py-4 border-b border-[var(--border-color)]">Başlık</th>
                  <th className="px-6 py-4 border-b border-[var(--border-color)]">Dil / Kat.</th>
                  <th className="px-6 py-4 border-b border-[var(--border-color)]">Klasör</th>
                  <th className="px-6 py-4 text-center border-b border-[var(--border-color)]">İzlenme</th>
                  <th className="px-6 py-4 text-right rounded-tr-xl border-b border-[var(--border-color)]">İşlemler</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                {renderTableBody()}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-gray-50/30 dark:bg-gray-800/20 border-t border-[var(--border-color)] flex justify-between items-center rounded-b-xl">
              <span className="text-xs text-gray-500 font-medium">Toplam {totalPages} sayfadan {currentPage}. sayfadasınız</span>
              <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-1.5 text-xs font-bold border rounded-lg disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-all">Geri</button>
                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-1.5 text-xs font-bold border rounded-lg disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-all">İleri</button>
              </div>
            </div>
          </div>
        </div>

        <SnippetFormModal
            isOpen={isModalOpen}
            onClose={(refresh) => {
              setIsModalOpen(false);
              setEditingSnippet(null);
              if (refresh) loadSnippets();
            }}
            snippet={editingSnippet}
            // İpucu: Kategori filtresi aktifse, yeni eklenecek snippet'in varsayılan kategorisi bu olabilir.
            defaultCategoryId={categoryIdParam}
        />
      </NavLayout>
  );
}