'use client';

import { X, Wand2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">Editör yükleniyor...</div>,
});

interface SnippetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  snippet?: any;
  isPage?: boolean; // Yeni sayfa modu prop'u
}

export default function SnippetFormModal({ isOpen, onClose, snippet, isPage = false }: SnippetFormModalProps) {
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
    // Sayfa modundaysak veya modal açıksa verileri yükle
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
      }
    }
  }, [isOpen, snippet, isPage]);

  const loadOptions = async () => {
    try {
      const [langsRes, catsRes, foldersRes, teamsRes, tagsRes] = await Promise.all([
        fetch('/api/languages'),
        fetch('/api/categories'),
        fetch('/api/folders'),
        fetch('/api/teams'),
        fetch('/api/tags'),
      ]);

      setLanguages(await langsRes.json());
      setCategories(await catsRes.json());
      setFolders(await foldersRes.json());
      setTeams(await teamsRes.json());
      setTags(await tagsRes.json());
    } catch (err) {
      console.error('Load options error:', err);
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
                  selectedLang?.monacoId === 'html' ? 'html' :
                      'babel';

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
      console.error('Format error:', err);
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
          title,
          description,
          code,
          languageId,
          categoryId,
          folderId,
          teamId,
          tagIds,
          isPublic,
          isFavorite,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'İşlem başarısız');
      }

      onClose(); // İşlem bitince ya modalı kapatır ya da sayfadan yönlendirir
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Modal değilse ve kapalıysa hiçbir şey render etme
  if (!isOpen && !isPage) return null;

  const selectedLanguage = languages.find(l => l.id === languageId);

  // Formun asıl içeriği
  const formContent = (
      <div className={`w-full ${!isPage ? 'max-w my-8' : ''}`}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-xl font-bold">
            {snippet ? 'Snippet Düzenle' : 'Yeni Snippet Oluştur'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                {error}
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Başlık *</label>
              <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Dil</label>
              <select
                  value={languageId || ''}
                  onChange={(e) => setLanguageId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seçiniz</option>
                {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.icon} {lang.name}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Kategori</label>
              <select
                  value={categoryId || ''}
                  onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seçiniz</option>
                {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Klasör</label>
              <select
                  value={folderId || ''}
                  onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seçiniz</option>
                {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Açıklama</label>
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Kod *</label>
              <button
                  type="button"
                  onClick={handleFormat}
                  disabled={!code || formatting}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors disabled:opacity-50"
              >
                <Wand2 size={14} />
                {formatting ? 'Formatlanıyor...' : 'Beautify'}
              </button>
            </div>

              <div className="border border-[var(--border-color)] rounded-lg overflow-hidden min-h-[300px]">
                <MonacoEditor
                    height="500px" // Sabit bir değer vermek form bütünlüğü için daha iyidir
                    language={selectedLanguage?.monacoId || 'javascript'}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    theme="vs-dark"
                    options={{
                      automaticLayout: true, // Modal açıldığında boyutun doğru hesaplanmasını sağlar
                      scrollBeyondLastLine: false,
                      minimap: { enabled: false },    fontSize: 14,
                      lineNumbers: 'on',
                      wordWrap: 'on', // Kodun sağa taşmasını engeller, aşağı kaydırır
                    }}
                />
              </div>
              

          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4"
              />
              <span className="text-sm">Herkese Açık</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="w-4 h-4"
              />
              <span className="text-sm">Favori</span>
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border-color)]">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button
                type="submit"
                disabled={loading || !title || !code}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : snippet ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
  );

  // Sayfa modundaysa sarmalayıcı (overlay) olmadan döndür
  if (isPage) {
    return formContent;
  }

  // Modal modundaysa overlay ile döndür
  return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        {formContent}
      </div>
  );
}