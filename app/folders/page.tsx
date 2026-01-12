'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavLayout from '@/components/NavLayout';
import EmojiPicker from '@/components/EmojiPicker';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import Swal from 'sweetalert2';

export default function FoldersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [folders, setFolders] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3b82f6', icon: '📁' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadFolders();
    }
  }, [user]);

  const loadFolders = async () => {
    try {
      const response = await fetch('/api/folders');
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error('Load folders error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url = editingFolder ? `/api/folders/${editingFolder.id}` : '/api/folders';
      const method = editingFolder ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setEditingFolder(null);
        setFormData({ name: '', description: '', color: '#3b82f6', icon: '📁' });
        loadFolders();

        Swal.fire({
          icon: 'success',
          title: editingFolder ? 'Klasör Güncellendi' : 'Klasör Oluşturuldu',
          text: 'Değişiklikler başarıyla kaydedildi.',
          timer: 1500,
          showConfirmButton: false,
          background: 'var(--card-bg)',
          color: 'var(--foreground)'
        });
      }
    } catch (error) {
      console.error('Submit error:', error);
      Swal.fire('Hata!', 'İşlem sırasında bir sorun oluştu.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (folder: any) => {
    setEditingFolder(folder);
    setFormData({
      name: folder.name,
      description: folder.description || '',
      color: folder.color || '#3b82f6',
      icon: folder.icon || '📁',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Klasörü silmek istediğinize emin misiniz?',
      text: "Bu klasörü sildiğinizde içindeki snippet'ler klasörsüz kalacaktır.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Evet, sil!',
      cancelButtonText: 'İptal',
      background: 'var(--card-bg)',
      color: 'var(--foreground)'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/folders/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await Swal.fire({
            title: 'Silindi!',
            text: 'Klasör başarıyla kaldırıldı.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: 'var(--card-bg)',
            color: 'var(--foreground)'
          });
          loadFolders();
        } else {
          Swal.fire('Hata!', 'Klasör silinemedi.', 'error');
        }
      } catch (error) {
        console.error('Delete error:', error);
        Swal.fire('Hata!', 'Bağlantı hatası oluştu.', 'error');
      }
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
      <NavLayout>
        <div className="p-6">
          <div className="max-w mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FolderOpen className="text-blue-500" />
                Klasör Yönetimi
              </h1>
              <button
                  onClick={() => {
                    setEditingFolder(null);
                    setFormData({ name: '', description: '', color: '#3b82f6', icon: '📁' });
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Plus size={20} />
                Yeni Klasör
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {folders.map((folder) => (
                  <div
                      key={folder.id}
                      className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{folder.icon || '📁'}</span>
                        <div>
                          <h3 className="font-bold text-lg">{folder.name}</h3>
                          {folder.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {folder.description}
                              </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-color)]">
                      <div className="flex items-center gap-2">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: folder.color }}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                      {folder._count?.snippets || 0} snippet
                    </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleEdit(folder)}
                            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded transition-colors"
                            title="Düzenle"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                            onClick={() => handleDelete(folder.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
                            title="Sil"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
              ))}
            </div>

            {folders.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Henüz klasör bulunmuyor</p>
                </div>
            )}
          </div>
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-[var(--card-bg)] rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                  <h2 className="text-xl font-bold">
                    {editingFolder ? 'Klasörü Düzenle' : 'Yeni Klasör'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-2xl font-light hover:text-red-500 transition-colors">
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Klasör Adı *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Açıklama</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Renk</label>
                      <input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-full h-10 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">İkon (Emoji)</label>
                      <EmojiPicker
                          selectedEmoji={formData.icon}
                          onSelect={(emoji) => setFormData({ ...formData, icon: emoji })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border-color)]">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      İptal
                    </button>
                    <button
                        type="submit"
                        disabled={formLoading}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {formLoading ? 'Kaydediliyor...' : editingFolder ? 'Güncelle' : 'Oluştur'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </NavLayout>
  );
}