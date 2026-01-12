'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavLayout from '@/components/NavLayout';
import { Users, Plus, Edit, Trash2, UserPlus, UserMinus } from 'lucide-react';
import Swal from 'sweetalert2';

export default function TeamsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadTeams();
      if (user.role === 'admin') {
        loadUsers();
      }
    }
  }, [user]);

  const loadTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Load teams error:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setAllUsers(data);
    } catch (error) {
      console.error('Load users error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url = editingTeam ? `/api/teams/${editingTeam.id}` : '/api/teams';
      const method = editingTeam ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setEditingTeam(null);
        setFormData({ name: '', description: '' });
        loadTeams();

        Swal.fire({
          icon: 'success',
          title: 'Başarılı',
          text: editingTeam ? 'Takım güncellendi.' : 'Yeni takım oluşturuldu.',
          timer: 1500,
          showConfirmButton: false,
          background: 'var(--card-bg)',
          color: 'var(--foreground)'
        });
      }
    } catch (error) {
      console.error('Submit error:', error);
      Swal.fire('Hata!', 'İşlem gerçekleştirilemedi.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (team: any) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Takımı silmek istediğinize emin misiniz?',
      text: "Bu işlem geri alınamaz ve tüm takım verileri silinir!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Evet, sil!',
      cancelButtonText: 'İptal',
      background: 'var(--card-bg)',
      color: 'var(--foreground)'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/teams/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          Swal.fire({
            title: 'Silindi!',
            text: 'Takım başarıyla silindi.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: 'var(--card-bg)',
            color: 'var(--foreground)'
          });
          loadTeams();
        }
      } catch (error) {
        console.error('Delete error:', error);
        Swal.fire('Hata!', 'Silme işlemi başarısız oldu.', 'error');
      }
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId || !selectedTeam) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(selectedUserId), role: 'member' }),
      });

      if (response.ok) {
        setIsMemberModalOpen(false);
        setSelectedUserId('');
        loadTeams();
        Swal.fire({
          icon: 'success',
          title: 'Üye Eklendi',
          timer: 1500,
          showConfirmButton: false,
          background: 'var(--card-bg)',
          color: 'var(--foreground)'
        });
      }
    } catch (error) {
      console.error('Add member error:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveMember = async (teamId: number, memberId: number) => {
    const result = await Swal.fire({
      title: 'Üyeyi çıkar?',
      text: "Bu üyeyi takımdan çıkarmak istediğinizden emin misiniz?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Evet, çıkar',
      cancelButtonText: 'Vazgeç',
      background: 'var(--card-bg)',
      color: 'var(--foreground)'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/teams/${teamId}/members?memberId=${memberId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          Swal.fire({
            title: 'Çıkarıldı',
            icon: 'success',
            timer: 1000,
            showConfirmButton: false,
            background: 'var(--card-bg)',
            color: 'var(--foreground)'
          });
          loadTeams();
        }
      } catch (error) {
        console.error('Remove member error:', error);
      }
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
      <NavLayout>
        <div className="p-6">
          <div className="max-w mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Users className="text-green-500" />
                Takım Yönetimi
              </h1>
              <button
                  onClick={() => {
                    setEditingTeam(null);
                    setFormData({ name: '', description: '' });
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Plus size={20} />
                Yeni Takım
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                  <div
                      key={team.id}
                      className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{team.name}</h3>
                        {team.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {team.description}
                            </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        👥 {team._count?.members || 0} üye
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        📝 {team._count?.snippets || 0} snippet
                      </div>
                    </div>

                    {team.members && team.members.length > 0 && (
                        <div className="mb-4 border-t border-[var(--border-color)] pt-4">
                          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Üyeler</p>
                          <div className="space-y-1">
                            {team.members.slice(0, 3).map((member: any) => (
                                <div key={member.id} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <span className="truncate flex items-center gap-1">
                            {member.user.name || member.user.email}
                            {member.role === 'owner' && <span title="Sahip">👑</span>}
                          </span>
                                  {user?.role === 'admin' && member.role !== 'owner' && (
                                      <button
                                          onClick={() => handleRemoveMember(team.id, member.id)}
                                          className="text-red-500 hover:text-red-700 p-1"
                                          title="Üyeyi Çıkar"
                                      >
                                        <UserMinus size={14} />
                                      </button>
                                  )}
                                </div>
                            ))}
                            {team.members.length > 3 && (
                                <p className="text-xs text-center text-gray-500 mt-2 font-medium">
                                  +{team.members.length - 3} üye daha
                                </p>
                            )}
                          </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-4 border-t border-[var(--border-color)]">
                      <button
                          onClick={() => {
                            setSelectedTeam(team);
                            setIsMemberModalOpen(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 rounded-md transition-colors border border-green-600/20"
                      >
                        <UserPlus size={18} />
                        <span className="text-sm font-medium">Ekle</span>
                      </button>
                      <button
                          onClick={() => handleEdit(team)}
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded-md transition-colors border border-blue-600/20"
                          title="Düzenle"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                          onClick={() => handleDelete(team.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-md transition-colors border border-red-600/20"
                          title="Sil"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
              ))}
            </div>

            {teams.length === 0 && (
                <div className="text-center py-12 bg-[var(--card-bg)] rounded-lg border border-dashed border-[var(--border-color)]">
                  <Users className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">Henüz hiç takım oluşturulmamış.</p>
                </div>
            )}
          </div>
        </div>

        {/* Takım Ekleme/Düzenleme Modalı */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-[var(--border-color)]">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-gray-50 dark:bg-gray-800/50">
                  <h2 className="text-xl font-bold">
                    {editingTeam ? 'Takım Düzenle' : 'Yeni Takım Oluştur'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-2xl font-light hover:text-red-500 transition-colors">
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Takım Adı *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        placeholder="Örn: Frontend Ekibi"
                        required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Açıklama</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        rows={3}
                        placeholder="Takım hakkında kısa bilgi..."
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-5 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                    >
                      İptal
                    </button>
                    <button
                        type="submit"
                        disabled={formLoading}
                        className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-bold disabled:opacity-50 shadow-lg shadow-green-500/30"
                    >
                      {formLoading ? 'Kaydediliyor...' : editingTeam ? 'Güncelle' : 'Takımı Kur'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* Üye Ekleme Modalı */}
        {isMemberModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[var(--card-bg)] rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-[var(--border-color)]">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-gray-50 dark:bg-gray-800/50">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <UserPlus size={20} className="text-green-500" />
                    Üye Ekle
                  </h2>
                  <button onClick={() => setIsMemberModalOpen(false)} className="text-2xl font-light hover:text-red-500 transition-colors">
                    ×
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-500">
                    <span className="font-bold text-[var(--foreground)]">{selectedTeam?.name}</span> takımına yeni bir üye seçin.
                  </p>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Kullanıcı Listesi</label>
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full px-4 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="">Kullanıcı seçin...</option>
                      {allUsers
                          .filter((u) => !selectedTeam?.members?.some((m: any) => m.userId === u.id))
                          .map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name ? `${u.name} (${u.email})` : u.email}
                              </option>
                          ))}
                    </select>
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                        type="button"
                        onClick={() => setIsMemberModalOpen(false)}
                        className="px-5 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                    >
                      İptal
                    </button>
                    <button
                        onClick={handleAddMember}
                        disabled={!selectedUserId || formLoading}
                        className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-bold disabled:opacity-50 shadow-lg shadow-green-500/30"
                    >
                      {formLoading ? 'Ekleniyor...' : 'Takıma Ekle'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </NavLayout>
  );
}