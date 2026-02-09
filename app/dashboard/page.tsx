'use client';

import { Sun, Moon, Plus, Menu, Tag } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import FolderTree from '@/components/FolderTree';
import SearchBar from '@/components/SearchBar';
import SnippetCard from '@/components/SnippetCard';
import SnippetDetail from '@/components/SnippetDetail';
import { useState, useEffect } from 'react';
import { Snippet, Folder, Tag as TagType, Language } from '@/lib/prisma';

interface SnippetWithRelations extends Snippet {
  language?: Language | null;
  folder?: Folder | null;
  tags?: Array<{ tag: TagType }>;
}

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [snippets, setSnippets] = useState<SnippetWithRelations[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | undefined>();
  const [selectedSnippet, setSelectedSnippet] = useState<SnippetWithRelations | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [snippetsData, foldersData, tagsData] = await Promise.all([
        fetch('/api/snippets').then(res => res.json()),
        fetch('/api/folders').then(res => res.json()),
        fetch('/api/tags').then(res => res.json()),
      ]);
      setSnippets(snippetsData);
      setFolders(foldersData);
      setTags(tagsData);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSnippets = snippets.filter(snippet => {
    const matchesFolder = selectedFolderId === undefined || snippet.folderId === selectedFolderId;
    const matchesSearch = !searchQuery || 
      snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      <header className="h-14 border-b border-[var(--border-color)] px-4 flex items-center justify-between bg-[var(--background)] z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors lg:hidden"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-xl font-bold">Snippet Manager</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Yeni Snippet</span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-0'
          } transition-all duration-300 border-r border-[var(--border-color)] bg-[var(--sidebar-bg)] overflow-hidden flex-shrink-0`}
        >
          <div className="h-full flex flex-col p-4">
            <div className="mb-4">
              <h2 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Klasörler
              </h2>
              <div className="scrollbar-thin overflow-y-auto max-h-96">
                <FolderTree
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  onFolderSelect={setSelectedFolderId}
                />
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Tag size={14} />
                Popüler Etiketler
              </h2>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 10).map(tag => (
                  <span
                    key={tag.id}
                    className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex overflow-hidden">
          <div className="w-full lg:w-2/5 border-r border-[var(--border-color)] flex flex-col bg-[var(--background)]">
            <div className="p-4 border-b border-[var(--border-color)]">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {filteredSnippets.length} snippet bulundu
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Yükleniyor...</div>
                </div>
              ) : filteredSnippets.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <p className="text-lg mb-2">Snippet bulunamadı</p>
                    <p className="text-sm">Yeni bir snippet oluşturun</p>
                  </div>
                </div>
              ) : (
                filteredSnippets.map(snippet => (
                  <SnippetCard
                    key={snippet.id}
                    snippet={snippet}
                    onClick={() => setSelectedSnippet(snippet)}
                    isSelected={selectedSnippet?.id === snippet.id}
                  />
                ))
              )}
            </div>
          </div>

          <div className="hidden lg:block flex-1 bg-[var(--background)]">
            <SnippetDetail
              snippet={selectedSnippet}
              onClose={() => setSelectedSnippet(null)}
              theme={theme}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
