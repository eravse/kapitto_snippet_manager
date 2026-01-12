'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  LayoutDashboard, 
  Code2, 
  Shield, 
  BookOpen, 
  LogOut, 
  Sun, 
  Moon,
  Menu,
  X,
  FileText,
  Users
} from 'lucide-react';
import { useState } from 'react';

interface NavLayoutProps {
  children: React.ReactNode;
}

export default function NavLayout({ children }: NavLayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return children;
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Klasörler', href: '/folders', icon: BookOpen },
    { name: 'Snippets', href: '/snippets', icon: Code2 },
    { name: 'Kategoriler', href: '/categories', icon: BookOpen },
    { name: 'Takımlar', href: '/teams', icon: Users },
    { name: 'Audit Logs', href: '/audit-logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="flex h-screen overflow-hidden">
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] transition-transform duration-300`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <h1 className="text-xl font-bold">

                <img src={"https://cdn.lojiplus.com/logos/kapitto_logo_blue.png"}/>
              </h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-[var(--card-hover)]'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[var(--border-color)]">
              <button
                onClick={() => router.push('/profile')}
                className="w-full flex items-center gap-3 px-4 py-3 mb-2 hover:bg-[var(--card-hover)] rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </button>
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[var(--card-hover)] rounded-lg transition-colors mb-2"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="lg:hidden h-14 border-b border-[var(--border-color)] px-4 flex items-center bg-[var(--background)]">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <Menu size={20} />
            </button>
            <h1 className="ml-3 text-lg font-bold">Snippet Manager</h1>
          </header>

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
        />
      )}
    </div>
  );
}
