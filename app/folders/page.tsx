'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavLayout from '@/components/NavLayout';
import SnippetFormModal from '@/components/SnippetFormModal';
import { Plus, Edit, Trash2, FolderOpen, FileText, ChevronRight, LayoutGrid } from 'lucide-react';
import Swal from 'sweetalert2';

export default function FoldersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<any>(null);

  // --- VERİ YÜKLEME ---
  const loadFolders = useCallback(async () => {
    try {
      const response = await fetch('/api/folders');
      const data = await response.json();
      const folderList = Array.isArray(data) ? data : (data.folders || []);
      setFolders(folderList);

      if (folderList.length > 0 && !selectedFolder) {
        setSelectedFolder(folderList[0]);
      }
    } catch (error) {
      console.error('Folders load error:', error);
    }
  }, [selectedFolder]);

  const loadSnippets = useCallback(async (folderId: number) => {
    if (!folderId) return;
    try {
      const response = await fetch(`/api/snippets?limit=50&folderId=${folderId}`);
      const data = await response.json();
      let cleanSnippets = data?.snippets || (Array.isArray(data) ? data : []);
      setSnippets(cleanSnippets);
    } catch (error) {
      setSnippets([]);
    }
  }, []);

  useEffect(() => { if (user) loadFolders(); }, [user, loadFolders]);
  useEffect(() => { if (selectedFolder?.id) loadSnippets(selectedFolder.id); }, [selectedFolder, loadSnippets]);

  // --- KLASÖR İŞLEMLERİ ---
  const handleAddFolder = async () => {
    const { value: folderName } = await Swal.fire({
      title: 'Yeni Klasör Oluştur',
      input: 'text',
      inputLabel: 'Klasör Adı',
      inputPlaceholder: 'Örn: React Components',
      showCancelButton: true,
      confirmButtonText: 'Oluştur',
      cancelButtonText: 'İptal',
      inputValidator: (value) => {
        if (!value) return 'Bir isim girmelisiniz!';
      }
    });

    if (folderName) {
      try {
        const response = await fetch('/api/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: folderName, icon: '📁', color: '#3b82f6' })
        });
        if (response.ok) {
          loadFolders();
          Swal.fire({ icon: 'success', title: 'Klasör Oluşturuldu', timer: 1000, showConfirmButton: false });
        }
      } catch (error) {
        Swal.fire('Hata', 'Klasör oluşturulamadı', 'error');
      }
    }
  };

  const handleDeleteFolder = async (e: React.MouseEvent, folder: any) => {
    e.stopPropagation(); // Klasörün seçilmesini engelle

    // Önce klasörün içinde snippet var mı kontrol et (Frontend koruması)
    // Not: API tarafında da bu kontrolü yapman güvenli olur.
    if (folder.snippets && folder.snippets.length > 0) {
      return Swal.fire({
        title: 'Hata!',
        text: 'Bu klasörün içinde snippetlar olduğu için silemezsiniz. Önce snippetları silin veya taşıyın.',
        icon: 'error'
      });
    }

    const result = await Swal.fire({
      title: `"${folder.name}" silinsin mi?`,
      text: "Bu işlem geri alınamaz.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Evet, Sil',
      cancelButtonText: 'Vazgeç'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/folders/${folder.id}`, { method: 'DELETE' });
        if (response.ok) {
          if (selectedFolder?.id === folder.id) setSelectedFolder(null);
          loadFolders();
          Swal.fire({ icon: 'success', title: 'Silindi', timer: 1000, showConfirmButton: false });
        } else {
          // Backend'den gelen "içinde snippet var" hatasını yakala
          const errorData = await response.json();
          Swal.fire('Hata', errorData.error || 'Klasör silinemedi', 'error');
        }
      } catch (error) {
        Swal.fire('Hata', 'İşlem sırasında bir hata oluştu', 'error');
      }
    }
  };

  // --- SNIPPET İŞLEMLERİ ---
  const handleOpenModal = (snippet: any = null) => {
    setEditingSnippet(snippet);
    setIsModalOpen(true);
  };

  const handleModalClose = (refresh: boolean = false) => {
    setIsModalOpen(false);
    setEditingSnippet(null);
    if (refresh && selectedFolder?.id) loadSnippets(selectedFolder.id);
  };

  const handleDeleteSnippet = async (id: number) => {
    const result = await Swal.fire({
      title: 'Snippet silinsin mi?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sil'
    });
    if (result.isConfirmed) {
      await fetch(`/api/snippets/${id}`, { method: 'DELETE' });
      loadSnippets(selectedFolder.id);
    }
  };

  if (loading || !user) return null;

  return (
      <NavLayout>
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[var(--background)]">

          {/* SOL PANEL (KLASÖRLER) */}
          <aside className="w-72 border-r border-[var(--border-color)] bg-[var(--card-bg)] flex flex-col">
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2">
                <FolderOpen size={18} className="text-blue-500" /> Klasörler
              </h2>
              <button
                  onClick={handleAddFolder}
                  className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {folders.map(f => (
                  <div
                      key={f.id}
                      onClick={() => setSelectedFolder(f)}
                      className={`group p-3 mb-1 rounded-lg cursor-pointer flex items-center justify-between transition-all ${selectedFolder?.id === f.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="text-xl shrink-0">{String(f.icon || '📁')}</span>
                      <span className="truncate font-medium text-sm">{String(f.name || 'Adsız')}</span>
                    </div>
                    <button
                        onClick={(e) => handleDeleteFolder(e, f)}
                        className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
              ))}
            </div>
          </aside>

          {/* SAĞ PANEL (SNIPPETS) */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {selectedFolder ? (
                <>
                  <div className="p-4 border-b border-[var(--border-color)] bg-[var(--card-bg)] flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm">
                      <LayoutGrid size={16} className="text-gray-400"/>
                      <ChevronRight size={14} className="text-gray-400"/>
                      <span className="font-bold text-[var(--foreground)]">{String(selectedFolder.name)}</span>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                    >
                      <Plus size={16}/> Yeni Snippet
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {snippets.map((s) => (
                          <div key={s.id} className="relative group">
                            <div
                                onClick={() => handleOpenModal(s)}
                                className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col items-center cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
                            >
                              <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                                <FileText size={24} className="text-gray-400 group-hover:text-blue-500" />
                              </div>
                              <span className="text-sm font-bold truncate w-full text-center">
                          {String(s.title || s.name || 'Adsız')}
                        </span>
                              <span className="text-[10px] mt-2 text-blue-500 font-bold uppercase tracking-wider">
                          {String(s.language || 'text')}
                        </span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteSnippet(s.id); }}
                                className="absolute -top-1 -right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-lg"
                            >
                              <Trash2 size={12}/>
                            </button>
                          </div>
                      ))}

                      <div onClick={() => handleOpenModal()} className="border-2 border-dashed border-[var(--border-color)] rounded-2xl p-4 flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 cursor-pointer min-h-[140px] bg-[var(--card-bg)]">
                        <Plus size={24}/>
                        <span className="text-xs font-bold mt-2">Yeni Snippet</span>
                      </div>
                    </div>
                  </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <FolderOpen size={48} className="opacity-10 mb-2" />
                  <p>Lütfen bir klasör seçin</p>
                </div>
            )}
          </main>
        </div>

        <SnippetFormModal
            isOpen={isModalOpen}
            isPage={false}
            onClose={() => handleModalClose(true)}
            snippet={editingSnippet}
          //  folderId={selectedFolder?.id}
        />
      </NavLayout>
  );
}