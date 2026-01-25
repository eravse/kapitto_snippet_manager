'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavLayout from '@/components/NavLayout';
import {
  Users, Plus, Edit, Trash2, UserPlus, UserMinus,
  ShieldCheck, Info, Mail, Search, X
} from 'lucide-react';
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
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadTeams();
      if (user.role === 'admin') loadUsers();
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
        Swal.fire({ icon: 'success', title: 'Başarılı', timer: 1500, showConfirmButton: false, background: 'var(--card-bg)', color: 'var(--foreground)' });
      }
    } catch (error) {
      Swal.fire('Hata!', 'İşlem gerçekleştirilemedi.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (team: any) => {
    setEditingTeam(team);
    setFormData({ name: team.name, description: team.description || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Takımı sil?',
      text: "Bu takıma ait tüm erişim yetkileri kaybolacaktır!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Evet, Sil',
      cancelButtonText: 'İptal',
      background: 'var(--card-bg)',
      color: 'var(--foreground)'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
        if (response.ok) {
          loadTeams();
          Swal.fire({ title: 'Silindi!', icon: 'success', timer: 1000, showConfirmButton: false });
        }
      } catch (error) {
        Swal.fire('Hata!', 'Silme işlemi başarısız.', 'error');
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
        Swal.fire({ icon: 'success', title: 'Üye Eklendi', timer: 1000, showConfirmButton: false });
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
      text: "Kullanıcının takıma erişimi kesilecektir.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Çıkar',
      cancelButtonText: 'Vazgeç',
      background: 'var(--card-bg)',
      color: 'var(--foreground)'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/teams/${teamId}/members?memberId=${memberId}`, { method: 'DELETE' });
        if (response.ok) {
          loadTeams();
          Swal.fire({ title: 'Çıkarıldı', icon: 'success', timer: 1000, showConfirmButton: false });
        }
      } catch (error) {
        console.error('Remove member error:', error);
      }
    }
  };

  if (loading || !user) return null;

  return (
      <NavLayout>
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-[#0b101a] min-h-screen">
          <div className="mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h1 className="text-3xl font-black flex items-center gap-3 text-slate-800 dark:text-white">
                  <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
                    <Users className="text-white" size={28} />
                  </div>
                  Takım Yönetimi
                </h1>
                <p className="text-slate-500 font-medium mt-2 ml-1">Ortak çalışma alanlarını ve yetkileri yönetin.</p>
              </div>

              <button
                  onClick={() => {
                    setEditingTeam(null);
                    setFormData({ name: '', description: '' });
                    setIsModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xl shadow-emerald-500/20 transition-all font-bold active:scale-95"
              >
                <Plus size={20} />
                Yeni Takım Oluştur
              </button>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                  <div
                      key={team.id}
                      className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Team Info Header */}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl font-bold text-emerald-500">
                          {team.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(team)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"><Edit size={16} /></button>
                          <button onClick={() => handleDelete(team.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><Trash2 size={16} /></button>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate">{team.name}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2 h-10 font-medium">
                        {team.description || 'Bu takım için bir açıklama girilmemiş.'}
                      </p>

                      <div className="flex items-center gap-4 mt-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Üyeler</span>
                          <span className="text-lg font-black text-slate-700 dark:text-slate-200">{team._count?.members || 0}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-100 dark:bg-slate-700" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Snippets</span>
                          <span className="text-lg font-black text-slate-700 dark:text-slate-200">{team._count?.snippets || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Member List Preview */}
                    <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700/50">
                      <div className="space-y-2">
                        {team.members?.slice(0, 3).map((member: any) => (
                            <div key={member.id} className="flex items-center justify-between group/member">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[10px] font-bold text-emerald-600">
                                  {member.user.name?.[0] || 'U'}
                                </div>
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">
                            {member.user.name || member.user.email.split('@')[0]}
                          </span>
                                {member.role === 'owner' && <ShieldCheck size={12} className="text-amber-500" title="Yönetici" />}
                              </div>
                              {user?.role === 'admin' && member.role !== 'owner' && (
                                  <button
                                      onClick={() => handleRemoveMember(team.id, member.id)}
                                      className="p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/member:opacity-100"
                                  >
                                    <UserMinus size={14} />
                                  </button>
                              )}
                            </div>
                        ))}
                        {team.members?.length > 3 && (
                            <p className="text-[10px] font-bold text-slate-400 text-center pt-1">+ {team.members.length - 3} Diğer Üye</p>
                        )}
                      </div>

                      <button
                          onClick={() => { setSelectedTeam(team); setIsMemberModalOpen(true); }}
                          className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all"
                      >
                        <UserPlus size={14} /> Üye Yönetimi
                      </button>
                    </div>
                  </div>
              ))}
            </div>

            {teams.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <Users className="text-slate-200 dark:text-slate-700 mb-4" size={64} />
                  <p className="text-slate-500 font-bold">Henüz bir takımınız bulunmuyor.</p>
                  <button onClick={() => setIsModalOpen(true)} className="mt-4 text-emerald-500 font-bold hover:underline">Hemen bir tane oluşturun</button>
                </div>
            )}
          </div>
        </div>

        {/* Modern Takım Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                <div className="p-8 pb-4 flex justify-between items-center">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                    {editingTeam ? 'Takım Ayarları' : 'Yeni Takım'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all text-slate-400">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 text-left">Takım İsmi</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-semibold"
                        placeholder="Örn: Tasarım Ekibi"
                        required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 text-left">Açıklama</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium resize-none"
                        rows={3}
                        placeholder="Bu takım ne hakkında?"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={formLoading} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-xl shadow-emerald-500/20 transition-all">
                      {formLoading ? 'İşleniyor...' : editingTeam ? 'Güncellemeleri Kaydet' : 'Takımı Oluştur'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* Modern Üye Ekleme Modal */}
        {isMemberModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                <div className="p-8 pb-4">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                    <UserPlus size={28} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">Ekibe Üye Kat</h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">{selectedTeam?.name} ekibi için yeni bir üye seçin.</p>
                </div>

                <div className="p-8 pt-0 space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Kullanıcı Seçimi</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-semibold appearance-none cursor-pointer"
                      >
                        <option value="">Bir kullanıcı arayın...</option>
                        {allUsers
                            .filter((u) => !selectedTeam?.members?.some((m: any) => m.userId === u.id))
                            .map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name ? `${u.name} (${u.email})` : u.email}
                                </option>
                            ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setIsMemberModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all rounded-xl">Vazgeç</button>
                    <button
                        onClick={handleAddMember}
                        disabled={!selectedUserId || formLoading}
                        className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50"
                    >
                      Takıma Ekle
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </NavLayout>
  );
}