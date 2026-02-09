'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavLayout from '@/components/NavLayout';
import {
  User, Lock, Save, Users, UserPlus, Database,
  Download, ShieldCheck, AlertTriangle, Trash2, Plus,
  Settings, CloudDownload, Key, Globe, Layout, Crown,
  Wrench, Hammer, FolderSync, Edit3, Shield, Search, CheckCircle2, AlertCircle, Mail, RotateCcw, GitBranch
} from 'lucide-react';
import UserAddModal from '@/components/admin/UserAddModal';
import UserEditModal from '@/components/admin/UserEditModal';
import EmailTemplateModal from '@/components/admin/EmailTemplateModal';
import IntegrationSettings from '@/components/IntegrationSettings';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

// --- Alt Bileşen: Tab Butonu ---
// --- Alt Bileşen: Sidebar Menü Öğesi ---
const SidebarItem = ({ active, label, icon: Icon, onClick, description }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${active
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-500'
      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
      }`}
  >
    <div className={`p-2 rounded-lg ${active ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
      <Icon size={18} />
    </div>
    <div>
      <div className="font-bold text-sm leading-none">{label}</div>
      {description && <div className={`text-[10px] mt-1 font-medium ${active ? 'text-white/70' : 'text-slate-400'}`}>{description}</div>}
    </div>
  </button>
);

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State Yönetimi
  const [activeTab, setActiveTab] = useState('profile');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Form State'leri
  const [profile, setProfile] = useState({ name: '', avatar: '', githubUsername: '' });
  const [githubData, setGithubData] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);

  // Migration State
  const [migrationData, setMigrationData] = useState({
    url: '',
    startId: 1,
    endId: 10,
    username: '',
    password: ''
  });
  const [migrationStatus, setMigrationStatus] = useState({
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    isMigrating: false,
    logs: [] as string[]
  });

  const [maintenanceStats, setMaintenanceStats] = useState({ unassignedCount: 0 });
  const [isMaintenanceProcessing, setIsMaintenanceProcessing] = useState(false);

  // Security States
  const [securityData, setSecurityData] = useState({
    twoFactorEnabled: false,
    allowedIPs: '',
    blockedIPs: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [twoFactorStep, setTwoFactorStep] = useState(0); // 0: Off, 1: Setup (QR), 2: Verify
  const [qrCode, setQrCode] = useState('');
  const [tempSecret, setTempSecret] = useState('');
  const [totpToken, setTotpToken] = useState('');

  // System Security (Admin)
  const [systemSecurity, setSystemSecurity] = useState({
    rateLimitPerMinute: 60,
    ddosProtectionEnabled: false,
    maintenanceMode: false
  });

  // Guard: Yetkisiz erişim
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // Veri Yükleme
  useEffect(() => {
    if (user) {
      fetchProfile();
      checkLicense();
      if (user.role === 'admin') {
        fetchUsers();
        fetchMaintenanceStats();
        fetchSystemSecurity();
        fetchTemplates();
      }
    }
  }, [user]);

  const checkLicense = async () => {
    try {
      const res = await fetch('/api/license');
      const data = await res.json();
      setIsPro(data.isPro);
    } catch (e) {
      setIsPro(false);
    }
  };

  const fetchSystemSecurity = async () => {
    try {
      const res = await fetch('/api/admin/security');
      const data = await res.json();
      if (res.ok) setSystemSecurity(data);
    } catch (error) {
      console.error('Failed to fetch system security settings');
    }
  };

  const handleSystemSecurityUpdate = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSecurity),
      });
      if (res.ok) toast.success('Sistem güvenlik ayarları güncellendi');
    } finally {
      setIsActionLoading(false);
    }
  };

  const fetchMaintenanceStats = async () => {
    try {
      const res = await fetch('/api/admin/maintenance');
      const data = await res.json();
      setMaintenanceStats(data);
    } catch (error) {
      console.error('Failed to fetch maintenance stats');
    }
  };

  const fetchGithubData = async (username: string) => {
    if (!username) return;
    try {
      const res = await fetch(`https://api.github.com/users/${username}`);
      if (res.ok) {
        const data = await res.json();
        setGithubData(data);
      } else {
        setGithubData(null);
      }
    } catch (error) {
      console.error('GitHub fetch error:', error);
      setGithubData(null);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      setProfile({
        name: data.name || '',
        avatar: data.avatar || '',
        githubUsername: data.githubUsername || ''
      });
      if (data.githubUsername) {
        fetchGithubData(data.githubUsername);
      }
      setSecurityData(prev => ({
        ...prev,
        twoFactorEnabled: data.twoFactorEnabled || false,
        allowedIPs: data.allowedIPs || '',
        blockedIPs: data.blockedIPs || ''
      }));
    } catch (e) {
      toast.error("Profil yüklenemedi");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data.users) {
        setUsers(data.users);
      } else {
        setUsers([]);
      }
    } catch (error) {
      toast.error("Kullanıcılar yüklenemedi");
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) toast.success('Profil güncellendi');
    } finally {
      setIsActionLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/email-templates');
      const data = await res.json();
      if (res.ok) setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates');
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (confirm('Bu şablonu silmek istediğinize emin misiniz?')) {
      try {
        const res = await fetch(`/api/admin/email-templates/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Şablon silindi');
          fetchTemplates();
        }
      } catch (error) {
        toast.error('Silme hatası');
      }
    }
  };

  const handleBackup = async () => {
    setIsActionLoading(true);
    try {
      const response = await fetch('/api/admin/backup');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${new Date().toISOString().split('T')[0]}.db`;
      link.click();
      toast.success("Yedek başarıyla indirildi");
    } catch (err) {
      toast.error("Yedekleme hatası");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      const res = await fetch('/api/auth/2fa/generate', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setQrCode(data.qrCodeUrl);
      setTempSecret(data.secret);
      setTwoFactorStep(1);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleVerify2FA = async () => {
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totpToken, secret: tempSecret }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success('2FA Başarıyla Etkinleştirildi');
      setSecurityData(prev => ({ ...prev, twoFactorEnabled: true }));
      setTwoFactorStep(0);
      setTotpToken('');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDisable2FA = async () => {
    const result = await Swal.fire({
      title: 'Emin misiniz?',
      text: 'İki faktörlü doğrulamayı devre dışı bırakmak hesabınızı daha az güvenli hale getirecektir.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, Devre Dışı Bırak',
      cancelButtonText: 'Vazgeç',
      background: 'rgb(15, 23, 42)',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/auth/2fa/verify', { method: 'DELETE' });
        if (res.ok) {
          toast.success('2FA Devre Dışı Bırakıldı');
          setSecurityData(prev => ({ ...prev, twoFactorEnabled: false }));
        }
      } catch (error) {
        toast.error('İşlem başarısız');
      }
    }
  };

  const handleUserDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Emin misiniz?',
      text: 'Bu kullanıcı ve tüm verileri (snippetlar, klasörler vb.) kalıcı olarak silinecektir. Bu işlem geri alınamaz!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, Kalıcı Olarak Sil',
      cancelButtonText: 'Vazgeç',
      background: 'rgb(15, 23, 42)',
      color: '#fff',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Kullanıcı başarıyla silindi');
          fetchUsers();
        } else {
          const data = await res.json();
          toast.error(data.error || 'Silme işlemi başarısız');
        }
      } catch (error) {
        toast.error('Bağlantı hatası');
      }
    }
  };

  const handleSecurityUpdate = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowedIPs: securityData.allowedIPs,
          blockedIPs: securityData.blockedIPs
        }),
      });
      if (res.ok) toast.success('Güvenlik ayarları güncellendi');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: any) => {
    e?.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Şifreniz güncellendi');
        setSecurityData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      } else {
        toast.error(data.error || 'Şifre güncellenemedi');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRunMaintenance = async () => {
    setIsMaintenanceProcessing(true);
    try {
      const res = await fetch('/api/admin/maintenance', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Bakım Tamamlandı',
          text: `${data.count} snippet '${data.folderName}' klasörüne taşındı.`,
          background: 'rgb(15, 23, 42)',
          color: '#fff'
        });
        fetchMaintenanceStats();
      } else {
        throw new Error(data.error || 'İşlem başarısız');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsMaintenanceProcessing(false);
    }
  };

  const handleMigrationStart = async () => {
    const total = migrationData.endId - migrationData.startId + 1;
    setMigrationStatus({
      total,
      current: 0,
      success: 0,
      failed: 0,
      isMigrating: true,
      logs: [`Taşıma başlatıldı: ${migrationData.url} (${migrationData.startId} - ${migrationData.endId})`]
    });

    try {
      const response = await fetch('/api/migration/legacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(migrationData),
      });

      if (!response.body) throw new Error('ReadableStream not supported');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataString = line.replace('data: ', '');
          if (!dataString) continue;

          const data = JSON.parse(dataString);

          if (data.type === 'progress') {
            setMigrationStatus(prev => ({
              ...prev,
              current: data.current,
              success: data.success,
              failed: data.failed,
              logs: [...prev.logs, data.message].slice(-50)
            }));
          } else if (data.type === 'complete') {
            setMigrationStatus(prev => ({ ...prev, isMigrating: false }));
            Swal.fire({
              icon: 'success',
              title: 'Taşıma Tamamlandı',
              text: `${data.success} snippet başarıyla içe aktarıldı.`,
              background: 'rgb(15, 23, 42)',
              color: '#fff'
            });
          } else if (data.type === 'error') {
            setMigrationStatus(prev => ({ ...prev, isMigrating: false, logs: [...prev.logs, `KRİTİK HATA: ${data.message}`] }));
            Swal.fire({
              icon: 'error',
              title: 'Taşıma Hatası',
              text: data.message,
              background: 'rgb(15, 23, 42)',
              color: '#fff'
            });
          }
        }
      }
    } catch (error: any) {
      setMigrationStatus(prev => ({ ...prev, isMigrating: false, logs: [...prev.logs, `HATA: ${error.message}`] }));
    }
  };

  if (loading || !user) return null;

  return (
    <NavLayout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-[#0b101a]">
        {/* Sidebar */}
        <aside className="w-80 h-full flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0b101a] shrink-0">
          <div className="p-6 pb-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                <Settings className="text-white" size={20} />
              </div>
              Ayarlar
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-2 ml-1">Hesap ve Sistem Yönetimi</p>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 py-2 mt-2">Hesap</div>
            <SidebarItem active={activeTab === 'profile'} label="Profil" description="Kişisel bilgiler ve profil resmi" icon={User} onClick={() => setActiveTab('profile')} />
            <SidebarItem active={activeTab === 'security'} label="Güvenlik" description="2FA, Şifre ve Oturumlar" icon={ShieldCheck} onClick={() => setActiveTab('security')} />

            {!isPro && user.role === 'admin' && (
              <>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 py-2 mt-6">Lisans</div>
                <SidebarItem active={activeTab === 'license'} label="Pro Aktivasyon" description="Lisans anahtarı girin" icon={Key} onClick={() => setActiveTab('license')} />
              </>
            )}

            {isPro && (
              <>
                <div className="text-xs font-black text-amber-500 uppercase tracking-widest px-4 py-2 mt-6 flex items-center gap-2">
                  <Crown size={12} /> PRO
                </div>
                <SidebarItem active={activeTab === 'pro'} label="Pro Ayarlar" description="Görünüm ve davranış" icon={Settings} onClick={() => setActiveTab('pro')} />
                <SidebarItem active={activeTab === 'integrations'} label="Entegrasyonlar" description="GitHub, Gitea bağlantıları" icon={GitBranch} onClick={() => setActiveTab('integrations')} />
                <SidebarItem active={activeTab === 'migration'} label="Veri Taşıma" description="Eski sürümden içe aktar" icon={CloudDownload} onClick={() => setActiveTab('migration')} />
              </>
            )}

            {user.role === 'admin' && (
              <>
                <div className="text-xs font-black text-indigo-500 uppercase tracking-widest px-4 py-2 mt-6 flex items-center gap-2">
                  <Shield size={12} /> YÖNETİM
                </div>
                <SidebarItem active={activeTab === 'users'} label="Kullanıcılar" description="Hesapları yönet" icon={Users} onClick={() => setActiveTab('users')} />
                <SidebarItem active={activeTab === 'system'} label="Sistem" description="Yedekleme ve logs" icon={Database} onClick={() => setActiveTab('system')} />
                <SidebarItem active={activeTab === 'maintenance'} label="Bakım" description="Veritabanı onarımı" icon={Wrench} onClick={() => setActiveTab('maintenance')} />
                <SidebarItem active={activeTab === 'email'} label="Mail Şablonları" description="Bildirim içerikleri" icon={Mail} onClick={() => setActiveTab('email')} />
              </>
            )}
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-slate-950">
                {user.name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{user.name || 'Kullanıcı'}</div>
                <div className="text-xs text-slate-500 truncate">{user.email}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto bg-slate-50/50 dark:bg-[#0b101a] relative">
          <div className="max-w-4xl mx-auto p-8 lg:p-12 min-h-full">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Görünen İsim</label>
                  <input
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">GitHub Kullanıcı Adı</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={profile.githubUsername}
                      onChange={(e) => setProfile({ ...profile, githubUsername: e.target.value })}
                      onBlur={() => fetchGithubData(profile.githubUsername)}
                      placeholder="Örn: eravse"
                    />
                    <button
                      type="button"
                      onClick={() => fetchGithubData(profile.githubUsername)}
                      className="px-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Search size={18} className="text-slate-500" />
                    </button>
                  </div>
                </div>

                {githubData && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <img src={githubData.avatar_url} alt="GitHub Avatar" className="w-16 h-16 rounded-full border-2 border-white dark:border-slate-800 shadow-lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg truncate">{githubData.name || githubData.login}</h4>
                        <a href={githubData.html_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          <Globe size={14} />
                        </a>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{githubData.bio || 'Bio yok'}</p>
                      <div className="flex gap-4 mt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span>{githubData.public_repos} Repo</span>
                        <span>{githubData.followers} Takipçi</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2 opacity-60">
                  <label className="text-sm font-semibold">E-posta (Sabit)</label>
                  <input className="flex h-10 w-full rounded-xl border bg-muted px-3 py-2 text-sm cursor-not-allowed" value={user.email} disabled />
                </div>
                <button
                  disabled={isActionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  <Save size={18} /> {isActionLoading ? 'Kaydediliyor...' : 'Profil Bilgilerini Kaydet'}
                </button>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-500">
                {/* 2FA Section */}
                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-xl ${securityData.twoFactorEnabled ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-400 shadow-slate-400/20'}`}>
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black">İki Faktörlü Doğrulama (2FA)</h3>
                        <p className="text-sm text-slate-500 font-medium">Hesabınıza ekstra bir güvenlik katmanı ekleyin.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => securityData.twoFactorEnabled ? handleDisable2FA() : handleSetup2FA()}
                      className={`px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 ${securityData.twoFactorEnabled ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'}`}
                    >
                      {securityData.twoFactorEnabled ? 'Devre Dışı Bırak' : 'Kuruluma Başla'}
                    </button>
                  </div>

                  {twoFactorStep === 1 && (
                    <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm animate-in zoom-in-95 duration-300">
                      <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="bg-white p-4 rounded-xl shadow-inner border-4 border-slate-50">
                          {qrCode ? (
                            <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                          ) : (
                            <div className="w-48 h-48 flex items-center justify-center bg-slate-100 animate-pulse rounded-xl" />
                          )}
                        </div>
                        <div className="flex-1 space-y-4">
                          <h4 className="font-bold text-lg">Uygulamayı Tara</h4>
                          <p className="text-sm text-slate-500">Google Authenticator veya benzeri bir uygulama ile bu QR kodu tarayın. Ardından uygulamadaki 6 haneli kodu aşağıya girin.</p>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Doğrulama Kodu</label>
                            <div className="flex gap-3">
                              <input
                                type="text"
                                maxLength={6}
                                placeholder="000 000"
                                value={totpToken}
                                onChange={(e) => setTotpToken(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-mono text-xl tracking-[0.5em] text-center"
                              />
                              <button
                                onClick={handleVerify2FA}
                                className="px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all"
                              >
                                Onayla
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Password Section */}
                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                      <Lock size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">Şifre Değiştir</h3>
                      <p className="text-sm text-slate-500 font-medium">Hesap güvenliğiniz için düzenli aralıklarla şifrenizi güncelleyin.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Mevcut Şifre</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all"
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Yeni Şifre</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all"
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Yeni Şifre (Tekrar)</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all"
                        value={securityData.confirmPassword}
                        onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handlePasswordUpdate}
                      className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                    >
                      <Lock size={18} /> Şifreyi Güncelle
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && user.role === 'admin' && (
              <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-500">
                {/* Database Management */}
                <div className="group p-8 bg-blue-500/5 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 transition-colors">
                  <div className="flex gap-6">
                    <div className="p-4 bg-blue-600 text-white rounded-xl shadow-xl shadow-blue-500/20">
                      <Database size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-xl mb-1">Veritabanı Yönetimi</h3>
                      <p className="text-sm text-slate-500 font-medium mb-6">SQLite veritabanının tam kopyasını indirerek verilerinizi koruyun.</p>
                      <button
                        onClick={handleBackup}
                        disabled={isActionLoading}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10"
                      >
                        <Download size={18} /> Yedek Al (.db)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
                  <AlertTriangle size={18} className="shrink-0" />
                  <p>Yedek dosyaları tüm kullanıcı verilerini içerir. Dosyayı güvenli bir ortamda sakladığınızdan emin olun.</p>
                </div>
              </div>
            )}

            {activeTab === 'users' && user.role === 'admin' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">Kullanıcı Yönetimi</h3>
                    <p className="text-sm text-slate-500 font-medium">Sistemdeki tüm hesapları ve yetkileri kontrol edin.</p>
                  </div>
                  <button
                    onClick={() => setIsUserModalOpen(true)}
                    className="flex items-center h-fit justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    <UserPlus size={20} /> Yeni Kullanıcı Ekle
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {users.map(u => (
                    <div key={u.id} className="p-6 flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-indigo-500/30 transition-all group">
                      <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-indigo-500/10">
                          {u.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-slate-800 dark:text-white">{u.name || 'İsimsiz'}</p>
                            {u.id === user.id && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold text-slate-500">Siz</span>
                            )}
                            {u.role === 'admin' && (
                              <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-bold border border-amber-500/20 flex items-center gap-1">
                                <Shield size={10} /> Admin
                              </span>
                            )}
                            {!u.isActive && (
                              <span className="text-[10px] bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full font-bold border border-rose-500/20">Pasif</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setIsEditModalOpen(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white rounded-xl text-xs font-bold transition-all"
                        >
                          <Edit3 size={16} /> Düzenle
                        </button>
                        <button
                          onClick={() => handleUserDelete(u.id)}
                          disabled={u.id === user.id}
                          className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all disabled:opacity-30"
                          title="Kullanıcıyı Sil"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && user.role === 'admin' && (
              <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                      <Wrench size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">Sistem Bakımı</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Veri bütünlüğünü sağlamak için otomatik düzeltme araçları.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <FolderSync size={20} className="text-blue-500" />
                        <h4 className="font-bold">Bağımsız Snippetlar</h4>
                      </div>
                      <p className="text-sm text-slate-500 mb-6">Herhangi bir klasöre atanmamış (orphaned) snippetları toplu olarak organize edin.</p>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl mb-6">
                        <span className="text-xs font-bold text-slate-500">Klasörsüz Snippets:</span>
                        <span className="text-lg font-black text-slate-800 dark:text-white">{maintenanceStats.unassignedCount}</span>
                      </div>

                      <button
                        onClick={handleRunMaintenance}
                        disabled={isMaintenanceProcessing || maintenanceStats.unassignedCount === 0}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isMaintenanceProcessing ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Hammer size={18} />
                            Migration Klasörüne Taşı
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-6 bg-slate-100/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-3">
                        <Plus size={20} className="text-slate-400" />
                      </div>
                      <p className="text-xs font-bold text-slate-400">Yeni bakım araçları yakında eklenecek.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && user.role === 'admin' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">Email Şablonları</h3>
                    <p className="text-sm text-slate-500 font-medium">Sistem tarafından gönderilen otomatik e-postaları düzenleyin.</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTemplate({ name: '', subject: '', content: '', context: 'SYSTEM' });
                      setIsEmailModalOpen(true);
                    }}
                    className="flex items-center h-fit justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                  >
                    <Plus size={20} /> Yeni Şablon Ekle
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {templates.map(t => (
                    <div key={t.id} className="p-6 flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-blue-500/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                          <Mail size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs">{t.name}</h4>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold text-slate-500">{t.context}</span>
                          </div>
                          <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-1">{t.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedTemplate(t);
                            setIsEmailModalOpen(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-blue-500 hover:text-white rounded-xl text-xs font-bold transition-all"
                        >
                          <Edit3 size={16} /> Düzenle
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(t.id)}
                          className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                          title="Şablonu Sil"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'pro' && isPro && (
              <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex items-center gap-4 p-8 bg-gradient-to-r from-amber-500/10 to-transparent rounded-xl border border-amber-500/20">
                  <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                    <Crown size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">Pro Lisans Aktif</h3>
                    <p className="text-slate-500 font-medium text-sm mt-1">Kapitto'nun tüm profesyonel özelliklerine erişiminiz var.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                      <Globe size={20} className="text-blue-500" />
                      <h4 className="font-bold">Genel Pro Ayarlar</h4>
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between group cursor-pointer">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-amber-500 transition-colors">Otomatik Senkronizasyon</span>
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500/20" defaultChecked />
                      </label>
                      <label className="flex items-center justify-between group cursor-pointer">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-amber-500 transition-colors">Gelişmiş Dışa Aktarımı Etkinleştir</span>
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500/20" defaultChecked />
                      </label>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                      <Layout size={20} className="text-purple-500" />
                      <h4 className="font-bold">Görünüm</h4>
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between group cursor-pointer">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-amber-500 transition-colors">Kompakt Liste Görünümü</span>
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500/20" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* IP Access Control (Moved from Security) */}
                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                      <Globe size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">IP Erişim Kontrolü</h3>
                      <p className="text-sm text-slate-500 font-medium">Sisteme sadece belirli IP adreslerinden erişilmesini sağlayın. (Pro Özellik)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">İzinli IP Adresleri (Lokal Whitelist)</label>
                        <textarea
                          placeholder="Örn: 192.168.1.1, 85.90.1.2"
                          className="w-full h-24 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-mono"
                          value={securityData.allowedIPs}
                          onChange={(e) => setSecurityData({ ...securityData, allowedIPs: e.target.value })}
                        />
                        <p className="text-[10px] text-slate-400 mt-2 ml-1">* Boş bırakılırsa tüm IP'lere izin verilir.</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1 text-rose-500">Engellenen IP Adresleri (Blacklist)</label>
                        <textarea
                          placeholder="Örn: 1.2.3.4, 4.5.6.7"
                          className="w-full h-24 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all text-sm font-mono"
                          value={securityData.blockedIPs}
                          onChange={(e) => setSecurityData({ ...securityData, blockedIPs: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleSecurityUpdate}
                      disabled={isActionLoading}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                      <Save size={18} /> {isActionLoading ? 'Kaydediliyor...' : 'IP Ayarlarını Kaydet'}
                    </button>
                  </div>
                </div>

                {/* System Security & Attack Control (Moved from System - Admin Only) */}
                {user.role === 'admin' && (
                  <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-rose-500/20">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black">Sistem Güvenliği & Atak Kontrolü</h3>
                        <p className="text-sm text-slate-500 font-medium">DoS koruması ve istek limitleme ayarlarını yönetin. (Pro Özellik)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm">DoS Koruması</h4>
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500/20"
                            checked={systemSecurity.ddosProtectionEnabled}
                            onChange={(e) => setSystemSecurity({ ...systemSecurity, ddosProtectionEnabled: e.target.checked })}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Şüpheli trafik artışlarında otomatik savunma sistemini devreye sokar.</p>
                      </div>

                      <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                        <h4 className="font-bold text-sm">İstek Limiti (RPM)</h4>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-center"
                            value={systemSecurity.rateLimitPerMinute}
                            onChange={(e) => setSystemSecurity({ ...systemSecurity, rateLimitPerMinute: parseInt(e.target.value) })}
                          />
                          <span className="text-[10px] font-black text-slate-400">RPM</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Dakika başına maksimum istek sayısı (User based).</p>
                      </div>

                      <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm">Bakım Modu</h4>
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500/20"
                            checked={systemSecurity.maintenanceMode}
                            onChange={(e) => setSystemSecurity({ ...systemSecurity, maintenanceMode: e.target.checked })}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Sistemi yönetici dışındaki tüm kullanıcılara kapatır.</p>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={handleSystemSecurityUpdate}
                        disabled={isActionLoading}
                        className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2"
                      >
                        <Save size={18} /> {isActionLoading ? 'Güncelleniyor...' : 'Sistem Güvenliğini Kaydet'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'migration' && isPro && (
              <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                      <CloudDownload size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">Eski Sürümlerden Veri Taşıma</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Kapitto v1.x sürümlerinden tüm snippetlerinizi taşıyın.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Legacy URL</label>
                        <div className="relative group">
                          <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
                          <input
                            type="text"
                            placeholder="https://old.kapitto.com/"
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                            value={migrationData.url}
                            onChange={(e) => setMigrationData({ ...migrationData, url: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Başlangıç ID</label>
                          <input
                            type="number"
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                            value={migrationData.startId}
                            onChange={(e) => setMigrationData({ ...migrationData, startId: parseInt(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Bitiş ID</label>
                          <input
                            type="number"
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                            value={migrationData.endId}
                            onChange={(e) => setMigrationData({ ...migrationData, endId: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Legacy Email</label>
                        <div className="relative group">
                          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
                          <input
                            type="text"
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                            value={migrationData.username}
                            onChange={(e) => setMigrationData({ ...migrationData, username: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Yönetici Şifresi</label>
                        <div className="relative group">
                          <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
                          <input
                            type="password"
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                            value={migrationData.password}
                            onChange={(e) => setMigrationData({ ...migrationData, password: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-6">
                    <button
                      onClick={handleMigrationStart}
                      disabled={migrationStatus.isMigrating || !migrationData.url}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {migrationStatus.isMigrating ? (
                        <>
                          <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                          Taşınıyor: {migrationStatus.current} / {migrationStatus.total}
                        </>
                      ) : (
                        <>
                          <CloudDownload size={20} />
                          Taşımayı Başlat
                        </>
                      )}
                    </button>

                    {migrationStatus.isMigrating && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                          <span>İlerleme</span>
                          <span>{Math.round((migrationStatus.current / migrationStatus.total) * 100)}%</span>
                        </div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${(migrationStatus.current / migrationStatus.total) * 100}%` }}
                          />
                        </div>
                        <div className="flex gap-4 text-[10px] font-bold">
                          <span className="text-emerald-500">Başarılı: {migrationStatus.success}</span>
                          <span className="text-rose-500">Hatalı: {migrationStatus.failed}</span>
                        </div>
                      </div>
                    )}

                    {migrationStatus.logs.length > 0 && (
                      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 max-h-48 overflow-y-auto font-mono text-[10px] text-slate-300 space-y-1">
                        {migrationStatus.logs.map((log, i) => (
                          <div key={i} className={log.includes('Hata') ? 'text-rose-400' : log.includes('Tamamlandı') ? 'text-emerald-400' : ''}>
                            {log}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && isPro && (
              <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <IntegrationSettings />
                </div>
              </div>
            )}

            {activeTab === 'license' && !isPro && user.role === 'admin' && (
              <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl text-center animate-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-amber-500/30 mb-6">
                  <Crown size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Pro Lisansını Etkinleştir</h2>
                <p className="text-slate-500 font-medium mb-8">Gelişmiş özelliklere erişmek için ürün anahtarınızı girin.</p>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const key = (e.target as any).licenseKey.value;
                  if (!key) return toast.error('Lütfen bir anahtar girin');

                  const toastId = toast.loading('Etkinleştiriliyor...');
                  try {
                    const res = await fetch('/api/admin/license/activate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ licenseKey: key })
                    });
                    const data = await res.json();

                    if (res.ok) {
                      toast.success('Lisans başarıyla etkinleştirildi!', { id: toastId });
                      setTimeout(() => window.location.reload(), 1500);
                    } else {
                      toast.error(data.error || 'Etkinleştirme başarısız', { id: toastId });
                    }
                  } catch (err) {
                    toast.error('Bağlantı hatası', { id: toastId });
                  }
                }}>
                  <div className="space-y-4">
                    <input
                      name="licenseKey"
                      type="text"
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      className="w-full text-center px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-lg tracking-widest uppercase focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
                    >
                      Etkinleştir
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>

      <UserAddModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSuccess={fetchUsers}
      />

      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSuccess={fetchUsers}
      />
      <EmailTemplateModal
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        onSuccess={fetchTemplates}
      />
    </NavLayout>
  );
}