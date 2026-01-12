'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavLayout from '@/components/NavLayout';
import { User, Lock, Save, Users, UserPlus, RefreshCw } from 'lucide-react';
import UserAddModal from '@/components/UserAddModal'; // Bu bileşeni bir önceki adımda oluşturmuştuk
import { Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State Yönetimi
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ name: '', avatar: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [users, setUsers] = useState<any[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Loading & Mesaj State'leri
  const [saveLoading, setSaveLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadProfile();
      if (user.role === 'admin') {
        loadUsers();
      }
    }
  }, [user]);

  // Mesajları 3 saniye sonra temizle
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      setProfile({ name: data.name || '', avatar: data.avatar || '' });
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };


  const handleDeleteUser = async (userId: number, userEmail: string) => {
    // Yönetici kendi kendini silemez
    if (userId === user?.id) {
      Swal.fire('Hata', 'Kendi hesabınızı silemezsiniz!', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Emin misiniz?',
      text: `${userEmail} kullanıcısı ve tüm verileri kalıcı olarak silinecek!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Evet, sil!',
      cancelButtonText: 'İptal',
      background: 'var(--card-bg)',
      color: 'var(--foreground)'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          Swal.fire({
            title: 'Silindi!',
            text: 'Kullanıcı başarıyla silindi.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
          loadUsers(); // Listeyi yenile
        } else {
          const data = await response.json();
          Swal.fire('Hata!', data.error || 'Silme işlemi başarısız.', 'error');
        }
      } catch (error) {
        console.error('Delete user error:', error);
        Swal.fire('Hata!', 'Sunucuyla bağlantı kurulamadı.', 'error');
      }
    }
  };
  
  
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profil başarıyla güncellendi!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Profil güncellenirken hata oluştu' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setMessage({ type: '', text: '' });

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor' });
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Şifre başarıyla değiştirildi!' });
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Şifre değiştirilemedi' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Şifre değiştirilirken hata oluştu' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUserUpdate = async (userId: number, data: any) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        loadUsers();
        setMessage({ type: 'success', text: 'Kullanıcı güncellendi!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Kullanıcı güncellenirken hata oluştu' });
    }
  };

  if (loading || !user) return null;

  return (
      <NavLayout>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Ayarlar</h1>

            {/* Bildirim Mesajı */}
            {message.text && (
                <div className={`mb-6 p-4 rounded-lg transition-all ${
                    message.type === 'success'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                  {message.text}
                </div>
            )}

            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm">
              {/* Tab Navigasyonu */}
              <div className="flex border-b border-[var(--border-color)] overflow-x-auto">
                {[
                  { id: 'profile', label: 'Profil', icon: User },
                  { id: 'password', label: 'Şifre', icon: Lock },
                  { id: 'users', label: 'Kullanıcılar', icon: Users, adminOnly: true }
                ].map((tab) => {
                  if (tab.adminOnly && user.role !== 'admin') return null;
                  const Icon = tab.icon;
                  return (
                      <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                              activeTab === tab.id
                                  ? 'border-b-2 border-blue-500 text-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                                  : 'hover:bg-[var(--card-hover)] text-gray-500'
                          }`}
                      >
                        <Icon size={18} />
                        {tab.label}
                      </button>
                  );
                })}
              </div>

              <div className="p-6">
                {/* Profil Tabı */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium mb-2">İsim</label>
                        <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Email (Değiştirilemez)</label>
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-[var(--border-color)] rounded-lg cursor-not-allowed opacity-70"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">Rol</label>
                        <input
                            type="text"
                            value={user.role}
                            disabled
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-[var(--border-color)] rounded-lg cursor-not-allowed capitalize opacity-70"
                        />
                      </div>
                      <button
                          type="submit"
                          disabled={saveLoading}
                          className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Save size={18} />
                        {saveLoading ? 'Kaydediliyor...' : 'Profil Bilgilerini Kaydet'}
                      </button>
                    </form>
                )}

                {/* Şifre Tabı */}
                {activeTab === 'password' && (
                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium mb-2">Mevcut Şifre</label>
                        <input
                            type="password"
                            value={passwords.currentPassword}
                            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Yeni Şifre</label>
                        <input
                            type="password"
                            value={passwords.newPassword}
                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            minLength={6}
                            required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Yeni Şifre (Tekrar)</label>
                        <input
                            type="password"
                            value={passwords.confirmPassword}
                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            minLength={6}
                            required
                        />
                      </div>
                      <button
                          type="submit"
                          disabled={passwordLoading}
                          className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Lock size={18} />
                        {passwordLoading ? 'Değiştiriliyor...' : 'Şifreyi Güncelle'}
                      </button>
                    </form>
                )}

                {/* Kullanıcı Yönetimi Tabı (Admin Only) */}
                {activeTab === 'users' && user.role === 'admin' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold">Kullanıcı Yönetimi</h3>
                          <p className="text-sm text-gray-500">Sistemdeki kullanıcıları yönetin ve yetkilendirin.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                              onClick={loadUsers}
                              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="Listeyi Yenile"
                          >
                            <RefreshCw size={20} className={usersLoading ? 'animate-spin' : ''} />
                          </button>
                          <button
                              onClick={() => setIsUserModalOpen(true)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors shadow-sm"
                          >
                            <UserPlus size={18} />
                            Yeni Kullanıcı
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {users.length === 0 && !usersLoading ? (
                            <div className="text-center py-10 text-gray-500 italic">Kullanıcı bulunamadı.</div>
                        ) : (
                            users.map((u) => (
                                <div key={u.id} className="flex flex-wrap items-center justify-between p-4 bg-[var(--sidebar-bg)] border border-[var(--border-color)] rounded-xl transition-all hover:border-blue-500/50">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 font-bold">
                                      {u.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                      <div className="font-semibold flex items-center gap-2">
                                        {u.name || 'İsimsiz'}
                                        {u.id === user.id && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full uppercase">Siz</span>}
                                      </div>
                                      <div className="text-sm text-gray-500">{u.email}</div>
                                      <div className="text-[11px] text-gray-400 mt-0.5 uppercase tracking-wider">
                                        {u._count?.snippets || 0} Snippet • {u._count?.folders || 0} Klasör
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 mt-4 sm:mt-0">
                                    <select
                                        value={u.role}
                                        disabled={u.id === user.id} // Kendini yetkisiz bırakmayı engelle
                                        onChange={(e) => handleUserUpdate(u.id, { ...u, role: e.target.value })}
                                        className="px-3 py-1.5 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="user">User</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                    <button
                                        onClick={() => handleUserUpdate(u.id, { ...u, isActive: !u.isActive })}
                                        disabled={u.id === user.id}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors min-w-[80px] ${
                                            u.isActive
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200'
                                        }`}
                                    >
                                      {u.isActive ? 'Aktif' : 'Pasif'}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(u.id, u.email)}
                                        disabled={u.id === user.id}
                                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Kullanıcıyı Sil"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>
                            ))
                        )}
                      </div>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Kullanıcı Ekleme Modalı */}
        <UserAddModal
            isOpen={isUserModalOpen}
            onClose={() => setIsUserModalOpen(false)}
            onSuccess={() => {
              loadUsers();
              setMessage({ type: 'success', text: 'Kullanıcı başarıyla oluşturuldu.' });
            }}
        />
      </NavLayout>
  );
}