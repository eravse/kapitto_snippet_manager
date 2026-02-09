'use client';

import { useState } from 'react';

const EMOJI_CATEGORIES = {
  'Sık Kullanılanlar': ['📝', '💡', '🔥', '⚡', '✨', '🎯', '🚀', '💻', '🎨', '📱'],
  'Yüzler': ['😀', '😎', '🤔', '😍', '🥳', '🤖', '👻', '💀', '👽', '🎃'],
  'Objeler': ['📦', '📁', '📂', '📊', '📈', '📉', '🔧', '🔨', '⚙️', '🛠️'],
  'Semboller': ['✅', '❌', '⭐', '🔴', '🟢', '🔵', '🟡', '🟣', '🟠', '⚪'],
  'Doğa': ['🌟', '🌈', '🌙', '☀️', '⛅', '🌍', '🌊', '🔥', '💧', '🌿'],
  'Aktivite': ['🎮', '🎯', '🎲', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎵'],
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  selectedEmoji?: string;
}

export default function EmojiPicker({ onSelect, selectedEmoji }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Sık Kullanılanlar');

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 text-3xl border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex items-center justify-center bg-white dark:bg-gray-800"
      >
        {selectedEmoji || '😀'}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-xl overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              {Object.keys(EMOJI_CATEGORIES).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`px-3 py-2 text-xs whitespace-nowrap transition-colors ${
                    activeCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="p-3 grid grid-cols-10 gap-1 max-h-48 overflow-y-auto">
              {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
