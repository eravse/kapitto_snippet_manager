'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavLayout from '@/components/NavLayout';
import EmojiPicker from '@/components/EmojiPicker';
import {
  Plus, Edit, Trash2, BookOpen, Layers,
  Search, ArrowRight, Folder, Hash, X
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function CategoriesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3b82f6', icon: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) loadCategories();
  }, [user]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Load categories error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '', color: '#3b82f6', icon: '' });
        loadCategories();
        Swal.fire({
          icon: 'success',
          title: 'Başarılı',
          timer: 1000,
          showConfirmButton: false,
          background: 'var(--card-bg)',
          color: 'var(--foreground)'
        });
      }
    } catch (error) {
      Swal.fire('Hata!', 'İşlem başarısız.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3b82f6',
      icon: category.icon || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Kategoriyi sil?',
      text: "Bu kategoriye bağlı tüm snippet'ler 'Kategorisiz' olarak işaretlenecektir.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Vazgeç',
      confirmButtonText: 'Evet, Sil',
      background: 'var(--card-bg)',
      color: 'var(--foreground)'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        if (response.ok) {
          loadCategories();
          Swal.fire({ icon: 'success', title: 'Kategori Silindi', timer: 1000, showConfirmButton: false });
        }
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const filteredCategories = categories.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || !user) return null;

  return (
      <NavLayout>
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-[#0b101a] min-h-screen transition-colors duration-300">
          <div className="mx-auto">

            {/* Header Bölümü */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
              <div className="space-y-1">
                <h1 className="text-3xl font-black flex items-center gap-3 text-slate-800 dark:text-white">
                  <div className="p-2.5 bg-purple-600 rounded-xl shadow-xl shadow-purple-500/20">
                    <Layers className="text-white" size={28} />
                  </div>
                  Kategoriler
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">
                  Snippet kütüphaneni düzenle ve organize et.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                  <input
                      type="text"
                      placeholder="Kategori ismine göre ara..."
                      className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-purple-500/10 transition-all font-medium text-sm shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                    onClick={() => {
                      setEditingCategory(null);
                      setFormData({ name: '', description: '', color: '#3b82f6', icon: '' });
                      setIsModalOpen(true);
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xl shadow-purple-500/20 transition-all font-bold text-sm active:scale-95 whitespace-nowrap"
                >
                  <Plus size={20} />
                  Yeni Kategori
                </button>
              </div>
            </div>

            {/* Grid Yapısı */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredCategories.map((category) => (
                  <div
                      key={category.id}
                      onClick={() => router.push(`/snippets?categoryId=${category.id}`)}
                      className="group relative cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 overflow-hidden"
                  >
                    {/* Arka Plan Dekoratif Blur (Kategori Rengine Göre) */}
                    <div
                        className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                        style={{ backgroundColor: category.color }}
                    />

                    {/* Aksiyon Butonları */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-10">
                      <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(category); }}
                          className="p-2.5 bg-white/80 dark:bg-slate-700/80 backdrop-blur-md text-slate-600 dark:text-slate-300 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }}
                          className="p-2.5 bg-white/80 dark:bg-slate-700/80 backdrop-blur-md text-slate-600 dark:text-slate-300 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Ana Kart İçeriği */}
                    <div className="flex flex-col items-center text-center space-y-6 pt-4">
                      <div
                          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                          style={{
                            backgroundColor: `${category.color}10`,
                            border: `2px solid ${category.color}30`,
                            color: category.color
                          }}
                      >
                        {category.icon || '📁'}
                      </div>

                      <div className="w-full">
                        <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-2 h-8 px-2 font-medium">
                          {category.description || 'Bu kategori için açıklama yok.'}
                        </p>
                      </div>

                      {/* Bilgi Rozeti */}
                      <div className="flex items-center justify-between w-full pt-4 border-t border-slate-50 dark:border-slate-700/50">
                        <div className="flex items-center gap-1.5">
                          <Hash size={12} className="text-slate-400" />
                          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                            {category._count?.snippets || 0} Snippets
                          </span>
                        </div>
                        <div className="p-1.5 rounded-full bg-slate-50 dark:bg-slate-700 group-hover:bg-purple-500 group-hover:text-white transition-all">
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
              ))}
            </div>

            {/* Boş Durum (Empty State) */}
            {filteredCategories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 mt-8">
                  <div className="p-6 bg-slate-100 dark:bg-slate-700/50 rounded-full mb-6">
                    <BookOpen className="text-slate-300 dark:text-slate-600" size={64} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Kategori Bulunamadı</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs text-center font-medium">
                    Aramanızla eşleşen bir kategori yok veya henüz hiç kategori oluşturmadınız.
                  </p>
                  <button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-6 text-purple-600 font-bold hover:text-purple-700 transition-colors"
                  >
                    Yeni bir tane ekle →
                  </button>
                </div>
            )}
          </div>
        </div>

        {/* Modal - Modernized */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                <div className="p-8 pb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                      {editingCategory ? 'Düzenle' : 'Yeni Kategori'}
                    </h2>
                    <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest">Kategori Detayları</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all text-slate-400">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kategori Adı</label>
                      <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-semibold"
                          placeholder="Örn: React Components"
                          required
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Simge</label>
                      <EmojiPicker selectedEmoji={formData.icon} onSelect={(emoji) => setFormData({ ...formData, icon: emoji })} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Açıklama</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-purple-500/10 outline-none transition-all resize-none font-medium text-sm"
                        rows={3}
                        placeholder="Bu kategori hakkında kısa bir not..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tema Rengi</label>
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-none overflow-hidden"
                      />
                      <span className="text-sm font-mono font-black text-slate-500 uppercase tracking-tighter">{formData.color}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={formLoading} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-xl shadow-purple-500/30 transition-all active:scale-95 disabled:opacity-50">
                      {formLoading ? 'Kaydediliyor...' : editingCategory ? 'Değişiklikleri Uygula' : 'Kategoriyi Kaydet'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </NavLayout>
  );
}