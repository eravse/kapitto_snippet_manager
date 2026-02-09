'use client';

import {Folder, ChevronRight, ChevronDown, Activity} from 'lucide-react';
import { useState } from 'react';
import { Folder as FolderType } from '@/lib/prisma';

interface FolderTreeProps {
  folders: FolderType[];
  selectedFolderId?: number;
  onFolderSelect: (folderId: number | undefined) => void;
}

export default function FolderTree({ folders, selectedFolderId, onFolderSelect }: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (expandedFolders.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const rootFolders = folders.filter(f => !f.parentId);

  const renderFolder = (folder: FolderType, level = 0) => {
    const children = folders.filter(f => f.parentId === folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-xl transition-colors ${
            isSelected
              ? 'bg-blue-500 text-white'
              : 'hover:bg-[var(--card-hover)]'
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => onFolderSelect(folder.id)}
        >
          {children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="p-0.5"
            >
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          )}
          {children.length === 0 && <div className="w-5" />}
          <Folder size={16} />
          <span className="text-sm truncate flex-1">{folder.name}</span>
        </div>
        {isExpanded && children.length > 0 && (
          <div>
            {children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
 
    <div className="space-y-1">
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-xl transition-colors ${
          selectedFolderId === undefined
            ? 'bg-blue-500 text-white'
            : 'hover:bg-[var(--card-hover)]'
        }`}
        onClick={() => onFolderSelect(undefined)}
      >
        <Folder size={16} />
        <span className="text-sm font-medium">Tüm Snippet'ler</span>
      </div>
      {rootFolders.map(folder => renderFolder(folder))}
    </div>      

  );
}
