'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavLayout from '@/components/NavLayout';
import {
  Users, Plus, Edit, Trash2, UserPlus, UserMinus,
  ShieldCheck, Mail, Search, X, Crown, Lock, ChevronRight
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
  const [isPro, setIsPro] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    const checkLicense = async () => {
      try {
        const res = await fetch('/api/license');
        const data = await res.json();
        setIsPro(data.isPro);
      } catch (err) {
        setIsPro(false);
      }
    };
    if (user) {
      checkLicense();
      loadTeams();
      if (user.role === 'admin') loadUsers();
    }
  }, [user]);

  const loadTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.status === 403) {
        setIsPro(false);
        return;
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setTeams(data);
      } else {
        setTeams([]);
      }
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
          timer: 1500,
          showConfirmButton: false,
          background: 'rgb(15, 23, 42)',
          color: '#fff'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: 'İşlem gerçekleştirilemedi.',
        background: 'rgb(15, 23, 42)',
        color: '#fff'
      });
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
      background: 'rgb(15, 23, 42)',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
        if (response.ok) {
          loadTeams();
          Swal.fire({ title: 'Silindi!', icon: 'success', timer: 1000, showConfirmButton: false, background: 'rgb(15, 23, 42)', color: '#fff' });
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Hata!', text: 'Silme işlemi başarısız.', background: 'rgb(15, 23, 42)', color: '#fff' });
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
        Swal.fire({ icon: 'success', title: 'Üye Eklendi', timer: 1000, showConfirmButton: false, background: 'rgb(15, 23, 42)', color: '#fff' });
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
      background: 'rgb(15, 23, 42)',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/teams/${teamId}/members?memberId=${memberId}`, { method: 'DELETE' });
        if (response.ok) {
          loadTeams();
          Swal.fire({ title: 'Çıkarıldı', icon: 'success', timer: 1000, showConfirmButton: false, background: 'rgb(15, 23, 42)', color: '#fff' });
        }
      } catch (error) {
        console.error('Remove member error:', error);
      }
    }
  };

  const handleUpdateRole = async (memberId: number, newRole: string) => {
    if (!selectedTeam) return;
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      });

      if (response.ok) {
        loadTeams();
        Swal.fire({
          icon: 'success',
          title: 'Rol Güncellendi',
          timer: 1000,
          showConfirmButton: false,
          background: 'rgb(15, 23, 42)',
          color: '#fff'
        });
      }
    } catch (error) {
      console.error('Update role error:', error);
    }
  };

  if (loading || !user) return null;

  if (isPro === false) {
    return (
      <NavLayout>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <div className="max-w-xl w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 flex items-center justify-center shadow-2xl mx-auto">
                <Lock size={40} className="text-amber-500" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Takım Özellikleri <span className="text-amber-500 font-black">PRO</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed">
                Ortak çalışma alanları, ekip içi snippet paylaşımı ve gelişmiş yetkilendirme özellikleri sadece <span className="text-amber-500 font-bold">Kapitto Pro</span> sürümünde mevcuttur.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {[
                "Sınırsız Takım Oluşturma",
                "Snippet Paylaşımı",
                "Rol Bazlı Erişim Kontrolü",
                "Takım İçi Audit Log"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Crown size={12} className="text-amber-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{feature}</span>
                </div>
              ))}
            </div>

            <button className="w-full py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-xl shadow-amber-500/20 transition-all font-black text-lg flex items-center justify-center gap-3 group">
              Pro'ya Yükselt
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </NavLayout>
    );
  }

  return (
    <NavLayout>
      <div className="p-4 md:p-8 bg-slate-50 dark:bg-[#0b101a] min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-1 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 dark:text-white">
                  Takım Yönetimi
                </h1>
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-sm">
                  PRO
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium ml-4 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Ortak çalışma alanlarını ve yetkileri yönetin
              </p>
            </div>

            <button
              onClick={() => {
                setEditingTeam(null);
                setFormData({ name: '', description: '' });
                setIsModalOpen(true);
              }}
              className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300 active:scale-95 font-black text-sm relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <Plus size={20} className="relative z-10 group-hover:rotate-90 transition-transform duration-300" />
              <span className="relative z-10">Yeni Takım Oluştur</span>
            </button>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams?.map((team) => (
              <div
                key={team.id}
                className="group bg-white dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col"
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-xl font-black text-emerald-500 shadow-inner">
                      {team.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button onClick={() => handleEdit(team)} className="p-2.5 text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 transition-all">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(team.id)} className="p-2.5 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-800 dark:text-white truncate tracking-tight">{team.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 h-10 font-medium leading-relaxed">
                    {team.description || 'Bu takım için bir açıklama girilmemiş.'}
                  </p>

                  <div className="flex items-center gap-6 mt-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Üyeler</span>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-emerald-500" />
                        <span className="text-xl font-black text-slate-800 dark:text-slate-200">{team._count?.members || 0}</span>
                      </div>
                    </div>
                    <div className="w-px h-10 bg-slate-100 dark:bg-slate-700/50" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Snippets</span>
                      <div className="flex items-center gap-2">
                        <Lock size={16} className="text-amber-500" />
                        <span className="text-xl font-black text-slate-800 dark:text-slate-200">{team._count?.snippets || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto px-8 py-6 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700/50">
                  <div className="space-y-3">
                    {team.members?.slice(0, 3).map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between group/member animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-400 border border-white dark:border-slate-600 shadow-sm">
                            {member.user.name?.[0] || 'U'}
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">
                            {member.user.name || member.user.email.split('@')[0]}
                          </span>
                          {member.role === 'owner' && (
                            <span title="Takım Sahibi" className="text-amber-500">
                              <ShieldCheck size={14} />
                            </span>
                          )}
                        </div>
                        {(user?.role === 'admin' || (team.members?.find((m: any) => m.userId === user.id)?.role === 'owner')) && member.userId !== user.id && (
                          <button
                            onClick={() => handleRemoveMember(team.id, member.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover/member:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                          >
                            <UserMinus size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    {team.members?.length > 3 && (
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center pt-2">
                        + {team.members.length - 3} Diğer Üye
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => { setSelectedTeam(team); setIsMemberModalOpen(true); }}
                    className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 shadow-sm hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-[0.98]"
                  >
                    <UserPlus size={16} /> Üye Yönetimi
                  </button>
                </div>
              </div>
            ))}
          </div>

          {teams.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-800/40 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700/50 animate-in fade-in duration-700">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6 shadow-inner">
                <Users size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white">Henüz bir takımınız bulunmuyor</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Ekibinizle snippet paylaşmak için ilk takımı oluşturun.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-8 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                Hemen bir tane oluşturun
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modern Takım Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                  <Plus size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                  {editingTeam ? 'Takım Ayarları' : 'Yeni Takım'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all text-slate-400">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Takım İsmi</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold placeholder:text-slate-400"
                    placeholder="Örn: Tasarım Ekibi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Açıklama</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium resize-none placeholder:text-slate-400"
                    rows={3}
                    placeholder="Bu takım ne için oluşturuluyor?"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-black shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {formLoading ? 'İşleniyor...' : editingTeam ? 'Güncellemeleri Kaydet' : 'Takımı Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Üye Yönetimi Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="p-10 pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-500/20">
                <Users size={32} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Üye Yönetimi</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-base mt-2">
                <span className="text-indigo-500 font-bold">{selectedTeam?.name}</span> ekibini yönetin.
              </p>
            </div>

            <div className="p-10 pt-4 space-y-8 overflow-y-auto max-h-[70vh]">
              {/* Current Members Section */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Mevcut Üyeler</label>
                <div className="space-y-3">
                  {selectedTeam?.members?.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 border border-white dark:border-slate-700 shadow-sm">
                          {member.user.name?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{member.user.name || member.user.email}</div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase">{member.role}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(user?.role === 'admin' || (selectedTeam.members?.find((m: any) => m.userId === user.id)?.role === 'owner')) && member.userId !== user.id && (
                          <>
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                              className="text-[10px] font-black bg-white dark:bg-slate-800 border-none rounded-xl px-2 py-1 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value="member">Üye</option>
                              <option value="admin">Admin</option>
                              <option value="owner">Sahip</option>
                            </select>
                            <button
                              onClick={() => handleRemoveMember(selectedTeam.id, member.id)}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <UserMinus size={16} />
                            </button>
                          </>
                        )}
                        {member.userId === user.id && (
                          <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-1 rounded-xl">Siz</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-700/50" />
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Kullanıcı Seçimi</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <Mail size={20} />
                  </div>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold appearance-none cursor-pointer"
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

              <div className="flex gap-4">
                <button onClick={() => setIsMemberModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-700">İptal</button>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedUserId || formLoading}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  Takıma Kat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NavLayout>
  );
}