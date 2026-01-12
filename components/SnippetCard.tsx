'use client';

import { Snippet } from '@/lib/prisma';
import { Code2, Calendar, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface SnippetCardProps {
  snippet: Snippet;
  onClick: () => void;
  isSelected: boolean;
}

export default function SnippetCard({ snippet, onClick, isSelected }: SnippetCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--card-hover)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base mb-1 truncate">{snippet.title}</h3>
          {snippet.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
              {snippet.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
            <div className="flex items-center gap-1">
              <Code2 size={14} />
              <span>Code</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formatDate(snippet.createdAt)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Kodu kopyala"
        >
          {copied ? (
            <Check size={18} className="text-green-500" />
          ) : (
            <Copy size={18} className="text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>
      <div className="mt-3">
        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-hidden line-clamp-3">
          <code>{snippet.code}</code>
        </pre>
      </div>
    </div>
  );
}
