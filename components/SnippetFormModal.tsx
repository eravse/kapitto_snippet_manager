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
    <div className={`bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full flex flex-col overflow-hidden ${!isPage ? 'max-w-5xl max-h-[95vh]' : ''}`}>
      {/* Modal Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/25">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              {snippet ? 'Snippet Düzenle' : 'Yeni Snippet'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {snippet ? `ID: #${snippet.id} • Detayları güncelleyin` : 'Kod kütüphanenize yeni bir parça ekleyin'}
            </p>
          </div>
          {snippet && snippet.versions && snippet.versions.length > 0 && (
            <span className="ml-2 px-3 py-1 text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 rounded-full">
              v{snippet.versions[0].major}.{snippet.versions[0].minor}
            </span>
          )}
        </div>
        <button
          onClick={() => onClose(false)}
          className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X size={24} />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800 flex items-center gap-3 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8 space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Başlık</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: React ile Form Yönetimi"
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
              required
            />
          </div>

          <div className="md:col-span-4 space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Yazılım Dili</label>
            <div className="relative">
              <select
                value={languageId || ''}
                onChange={(e) => setLanguageId(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="">Dil Seçin</option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>{lang.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Kategori</label>
            <div className="relative">
              <select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white appearance-none cursor-pointer ${defaultCategoryId && !snippet ? 'border-blue-500 ring-4 ring-blue-500/10' : ''}`}
              >
                <option value="">Kategori Seçin</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Klasör</label>
            <div className="relative">
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="">Klasör Seçin</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Takım</label>
            <div className="relative">
              <select
                value={teamId || ''}
                onChange={(e) => setTeamId(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="">Kişisel (Takım Yok)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Açıklama</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
            rows={2}
            placeholder="Bu snippet ne işe yarıyor? Küçük bir not bırakın..."
          />
        </div>

        {/* Monaco Editor Bölümü */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kod Editörü</label>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              <span className="text-xs text-slate-400 font-mono">{selectedLanguage?.name || 'Plain Text'}</span>
            </div>
            <button
              type="button"
              onClick={handleFormat}
              disabled={!code || formatting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all active:scale-95 disabled:opacity-50 group shadow-sm"
            >
              <Wand2 size={14} className="group-hover:text-purple-500 transition-colors" />
              {formatting ? 'Düzeltiliyor...' : 'Otomatik Düzenle'}
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-[#1e1e1e] ring-4 ring-slate-100 dark:ring-slate-800/50">
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
                padding: { top: 20, bottom: 20 },
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                fontLigatures: true,
                lineHeight: 1.6
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`flex items-center justify-between p-5 rounded-xl border-2 transition-all cursor-pointer group ${isPublic ? 'bg-blue-50/50 border-blue-500/50 dark:bg-blue-900/10 dark:border-blue-500/30' : 'bg-white border-slate-100 dark:bg-slate-800/30 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
            onClick={() => setIsPublic(!isPublic)}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl transition-colors ${isPublic ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                <Globe size={20} />
              </div>
              <div>
                <p className={`text-sm font-bold ${isPublic ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>Herkese Açık</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Bu snippet profilinizde görünür.</p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isPublic ? 'border-blue-500 bg-blue-500' : 'border-slate-200 dark:border-slate-700'}`}>
              {isPublic && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
          </div>

          <div
            className={`flex items-center justify-between p-5 rounded-xl border-2 transition-all cursor-pointer group ${isFavorite ? 'bg-rose-50/50 border-rose-500/50 dark:bg-rose-900/10 dark:border-rose-500/30' : 'bg-white border-slate-100 dark:bg-slate-800/30 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
            onClick={() => setIsFavorite(!isFavorite)}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl transition-colors ${isFavorite ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                <Heart size={20} />
              </div>
              <div>
                <p className={`text-sm font-bold ${isFavorite ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-200'}`}>Favorilere Ekle</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Hızlı erişim için işaretleyin.</p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isFavorite ? 'border-rose-500 bg-rose-500' : 'border-slate-200 dark:border-slate-700'}`}>
              {isFavorite && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end pt-6 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md -mx-8 px-8 -mb-4 pb-4 z-10">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-6 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={loading || !title || !code}
            className="px-8 py-3.5 text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 hover:shadow-blue-500/40"
          >
            {loading ? 'İşleniyor...' : snippet ? 'Değişiklikleri Kaydet' : 'Snippet Oluştur'}
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