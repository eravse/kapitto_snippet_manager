'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavLayout from '@/components/NavLayout';
import { Plus, Search, Edit, Trash2, Eye, Heart, FolderOpen } from 'lucide-react';
import SnippetFormModal from '@/components/SnippetFormModal';
import Swal from 'sweetalert2';
import Link from 'next/link';

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
}

export default function SnippetsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loadingSnippets, setLoadingSnippets] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadSnippets();
    }
  }, [user, searchQuery]);

  const loadSnippets = async () => {
    try {
      const url = searchQuery
          ? `/api/snippets?search=${encodeURIComponent(searchQuery)}`
          : '/api/snippets';
      const response = await fetch(url);
      const data = await response.json();
      setSnippets(data);
    } catch (error) {
      console.error('Load snippets error:', error);
    } finally {
      setLoadingSnippets(false);
    }
  };
  const handleCreateNew = () => {
    router.push('/snippets/new');
  };
  const handleDelete = async (id: number) => {
    // SweetAlert Onay Penceresi
    const result = await Swal.fire({
      title: 'Emin misiniz?',
      text: "Bu snippet kalıcı olarak silinecektir!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Evet, sil!',
      cancelButtonText: 'İptal',
      // Temanıza uyum sağlaması için opsiyonel:
      background: 'var(--card-bg)',
      color: 'var(--foreground)'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/snippets/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Başarılı bildirim mesajı
          await Swal.fire({
            title: 'Silindi!',
            text: 'Snippet başarıyla silindi.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: 'var(--card-bg)',
            color: 'var(--foreground)'
          });
          loadSnippets();
        } else {
          Swal.fire('Hata!', 'Silme işlemi sırasında bir hata oluştu.', 'error');
        }
      } catch (error) {
        console.error('Delete error:', error);
        Swal.fire('Hata!', 'Sunucuyla bağlantı kurulamadı.', 'error');
      }
    }
  };

  const handleEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet);
    
    window.open(`/snippets/edit/${snippet.id}`, '_blank');
 //   setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSnippet(null);
    loadSnippets();
  };

  if (loading || !user) {
    return null;
  }

  return (
      <NavLayout>
        <div className="p-6">
          <div className="max-w mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Snippet Yönetimi</h1>

              <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  title="Yeni Snippet"
              >
                <Plus size={20} />
                Yeni Snippet
              </button>
              
            </div>

            {/* Arama Barı */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Snippet ara..."
                    className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Snippet Tablosu */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Başlık</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Kategori</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Dil</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Klasör</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">İstatistik</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">İşlemler</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                  {snippets.map((snippet) => (
                      <tr key={snippet.id} className="hover:bg-[var(--card-hover)] transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {snippet.title}
                              {snippet.isFavorite && <Heart size={14} className="text-red-500 fill-red-500" />}
                            </div>
                            {snippet.description && (
                                <div className="text-sm text-gray-500 truncate max-w-md">
                                  {snippet.description}
                                </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {snippet.category && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm">
                            {snippet.category.icon && <span>{snippet.category.icon}</span>}
                                {snippet.category.name}
                          </span>
                          )}
                        </td>
                        <td className="px-6 py-4">{snippet.language?.name || '-'}</td>
                        <td className="px-6 py-4">
                          {snippet.folder && (
                              <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <FolderOpen size={14} />
                                {snippet.folder.name}
                          </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Eye size={14} />
                            {snippet.viewCount}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => handleEdit(snippet)}
                                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded transition-colors"
                                title="Düzenle"
                            >
                              <Edit size={18} />
                            </button>
                            
                            <button
                                onClick={() => handleDelete(snippet.id)}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
                                title="Sil"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              {snippets.length === 0 && !loadingSnippets && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Henüz snippet bulunmuyor</p>
                  </div>
              )}
            </div>
          </div>
        </div>

      {/*  <SnippetFormModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            snippet={editingSnippet}
        />*/}
      </NavLayout>
  );
}