'use client';

import { Snippet, Language } from '@/lib/prisma';
import { X, Copy, Check, Edit, Trash2, Calendar, Folder as FolderIcon } from 'lucide-react';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center">Editör yükleniyor...</div>,
});

interface SnippetWithRelations extends Snippet {
  language?: Language | null;
}

interface SnippetDetailProps {
  snippet: SnippetWithRelations | null;
  onClose: () => void;
  onEdit?: (snippet: SnippetWithRelations) => void;
  onDelete?: (snippet: SnippetWithRelations) => void;
  theme: 'light' | 'dark';
}

export default function SnippetDetail({ snippet, onClose, onEdit, onDelete, theme }: SnippetDetailProps) {
  const [copied, setCopied] = useState(false);

  if (!snippet) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">Snippet seçilmedi</p>
          <p className="text-sm">Görüntülemek için bir snippet seçin</p>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
        <h2 className="text-xl font-bold truncate flex-1">{snippet.title}</h2>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(snippet)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              title="Düzenle"
            >
              <Edit size={18} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(snippet)}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-xl transition-colors"
              title="Sil"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-[var(--border-color)]">
        {snippet.description && (
          <p className="text-gray-700 dark:text-gray-300 mb-4">{snippet.description}</p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{formatDate(snippet.createdAt)}</span>
          </div>
          {snippet.folderId && (
            <div className="flex items-center gap-2">
              <FolderIcon size={16} />
              <span>Klasör ID: {snippet.folderId}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] bg-[var(--sidebar-bg)]">
          <span className="text-sm font-medium">Kod</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors text-sm"
          >
            {copied ? (
              <>
                <Check size={16} />
                Kopyalandı
              </>
            ) : (
              <>
                <Copy size={16} />
                Kopyala
              </>
            )}
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <MonacoEditor
            height="100%"
            language={snippet.language?.monacoId || 'javascript'}
            value={snippet.code}
            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
