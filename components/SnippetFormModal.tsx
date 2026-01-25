'use client';

import { X, Wand2, Shield, Heart, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center bg-slate-900 rounded-xl text-slate-400 font-mono italic">Editör yükleniyor...</div>,
});

interface SnippetFormModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  snippet?: any;
  isPage?: boolean;
  defaultCategoryId?: string | null; // Yeni eklenen prop
}

export default function SnippetFormModal({
                                           isOpen,
                                           onClose,
                                           snippet,
                                           isPage = false,
                                           defaultCategoryId = null
                                         }: SnippetFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [languageId, setLanguageId] = useState<number | undefined>();
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [folderId, setFolderId] = useState<number | undefined>();
  const [teamId, setTeamId] = useState<number | undefined>();
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [error, setError] = useState('');

  const [languages, setLanguages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen || isPage) {
      loadOptions();
      if (snippet) {
        setTitle(snippet.title || '');
        setDescription(snippet.description || '');
        setCode(snippet.code || '');
        setLanguageId(snippet.language?.id || snippet.languageId);
        setCategoryId(snippet.category?.id || snippet.categoryId);
        setFolderId(snippet.folder?.id || snippet.folderId);
        setTeamId(snippet.team?.id || snippet.teamId);
        setTagIds(snippet.tags?.map((t: any) => t.tag?.id || t.id) || []);
        setIsPublic(snippet.isPublic ?? false);
        setIsFavorite(snippet.isFavorite ?? false);
      } else {
        resetForm();
        // Eğer URL'den bir categoryId gelmişse, yeni snippet oluştururken onu ata
        if (defaultCategoryId) {
          setCategoryId(parseInt(defaultCategoryId));
        }
      }
    }
  }, [isOpen, snippet, isPage, defaultCategoryId]);

  const loadOptions = async () => {
    try {
      const [langsRes, catsRes, foldersRes, teamsRes, tagsRes] = await Promise.all([
        fetch('/api/languages'),
        fetch('/api/categories'),
        fetch('/api/folders'),
        fetch('/api/teams'),
        fetch('/api/tags'),
      ]);

      if (langsRes.ok) setLanguages(await langsRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
      if (foldersRes.ok) setFolders(await foldersRes.json());
      if (teamsRes.ok) setTeams(await teamsRes.json());
      if (tagsRes.ok) setTags(await tagsRes.json());
    } catch (err) {
      console.error('Opsiyonlar yüklenirken hata:', err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCode('');
    setLanguageId(undefined);
    setCategoryId(undefined);
    setFolderId(undefined);
    setTeamId(undefined);
    setTagIds([]);
    setIsPublic(false);
    setIsFavorite(false);
    setError('');
  };

  const handleFormat = async () => {
    if (!code) return;
    setFormatting(true);
    try {
      const selectedLang = languages.find(l => l.id === languageId);
      const parser = selectedLang?.monacoId === 'typescript' ? 'typescript' :
          selectedLang?.monacoId === 'json' ? 'json' :
              selectedLang?.monacoId === 'css' ? 'css' :
                  selectedLang?.monacoId === 'html' ? 'html' : 'babel';

      const response = await fetch('/api/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, parser }),
      });

      if (response.ok) {
        const data = await response.json();
        setCode(data.formatted);
      }
    } catch (err) {
      console.error('Format hatası:', err);
    } finally {
      setFormatting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = snippet?.id ? `/api/snippets/${snippet.id}` : '/api/snippets';
      const method = snippet?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, code, languageId, categoryId,
          folderId, teamId, tagIds, isPublic, isFavorite,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'İşlem başarısız');
      }

      onClose(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !isPage) return null;

  const selectedLanguage = languages.find(l => l.id === languageId);

  const formContent = (
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full flex flex-col overflow-hidden ${!isPage ? 'max-w-5xl max-h-[95vh]' : ''}`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
              <Shield size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white leading-none">
                {snippet ? 'Snippet Düzenle' : 'Yeni Snippet'}
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 font-medium tracking-wide uppercase">
                {snippet ? `ID: #${snippet.id}` : 'Kod Kütüphanene Yeni Bir Parça Ekle'}
              </p>
            </div>
            {snippet && snippet.versions && snippet.versions.length > 0 && (
                <span className="ml-2 px-2.5 py-1 text-[10px] font-black bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg">
                  V{snippet.versions[0].major}.{snippet.versions[0].minor}
                </span>
            )}
          </div>
          <button onClick={() => onClose(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-800 font-medium text-sm">
                ⚠️ {error}
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Başlık *</label>
              <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Harika bir başlık yazın..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Yazılım Dili</label>
              <select
                  value={languageId || ''}
                  onChange={(e) => setLanguageId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium appearance-none cursor-pointer"
              >
                <option value="">Dil Seçin</option>
                {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Kategori</label>
              <select
                  value={categoryId || ''}
                  onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium ${defaultCategoryId && !snippet ? 'border-blue-500 ring-1 ring-blue-500/20' : ''}`}
              >
                <option value="">Kategori Seçin</option>
                {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Klasör</label>
              <select
                  value={folderId || ''}
                  onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              >
                <option value="">Klasör Seçin</option>
                {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Takım</label>
              <select
                  value={teamId || ''}
                  onChange={(e) => setTeamId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              >
                <option value="">Kişisel (Takım Yok)</option>
                {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Açıklama</label>
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none font-medium"
                rows={2}
                placeholder="Bu snippet ne işe yarıyor? Küçük bir not bırakın..."
            />
          </div>

          {/* Monaco Editor Bölümü */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Kod Editörü *</label>
              <button
                  type="button"
                  onClick={handleFormat}
                  disabled={!code || formatting}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <Wand2 size={14} />
                {formatting ? 'Düzeltiliyor...' : 'Kodu Güzelleştir'}
              </button>
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-inner bg-[#1e1e1e]">
              <MonacoEditor
                  height={isPage ? "550px" : "400px"}
                  language={selectedLanguage?.monacoId || 'javascript'}
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                    fontLigatures: true
                  }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${isPublic ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'}`}
                onClick={() => setIsPublic(!isPublic)}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isPublic ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                  <Globe size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Herkese Açık</p>
                  <p className="text-[10px] text-slate-500 font-medium">Bu snippet profilinizde görünebilir.</p>
                </div>
              </div>
              <input type="checkbox" checked={isPublic} onChange={() => {}} className="w-5 h-5 rounded-full border-slate-300 text-blue-600" />
            </div>

            <div
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${isFavorite ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'}`}
                onClick={() => setIsFavorite(!isFavorite)}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isFavorite ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                  <Heart size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Favorilere Ekle</p>
                  <p className="text-[10px] text-slate-500 font-medium">Hızlı erişim için işaretleyin.</p>
                </div>
              </div>
              <input type="checkbox" checked={isFavorite} onChange={() => {}} className="w-5 h-5 rounded-full border-slate-300 text-rose-600" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-6 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900">
            <button
                type="button"
                onClick={() => onClose(false)}
                className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
            >
              Vazgeç
            </button>
            <button
                type="submit"
                disabled={loading || !title || !code}
                className="px-10 py-3 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? 'İşleniyor...' : snippet ? 'Güncellemeleri Kaydet' : 'Snippet\'ı Kaydet'}
            </button>
          </div>
        </form>
      </div>
  );

  if (isPage) return <div className="max-w-7xl mx-auto p-6">{formContent}</div>;

  return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
        <div className="w-full max-w-5xl animate-in zoom-in-95 fade-in duration-300 ease-out">
          {formContent}
        </div>
      </div>
  );
}