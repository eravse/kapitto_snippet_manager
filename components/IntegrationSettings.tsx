'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Github, Save, Eye, EyeOff, Server } from 'lucide-react';

export default function IntegrationSettings() {
    const [settings, setSettings] = useState({
        githubAccessToken: '',
        giteaAccessToken: '',
        giteaBaseUrl: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showGithubToken, setShowGithubToken] = useState(false);
    const [showGiteaToken, setShowGiteaToken] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/profile/integrations');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSettings({
                githubAccessToken: data.hasGithubToken ? '********' : '',
                giteaAccessToken: data.hasGiteaToken ? '********' : '',
                giteaBaseUrl: data.giteaBaseUrl || '',
            });
        } catch (error) {
            console.error(error);
            toast.error('Ayarlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const body: any = { giteaBaseUrl: settings.giteaBaseUrl };
            // Only send tokens if they are not masked (i.e., changed by user)
            if (settings.githubAccessToken !== '********') {
                body.githubAccessToken = settings.githubAccessToken;
            }
            if (settings.giteaAccessToken !== '********') {
                body.giteaAccessToken = settings.giteaAccessToken;
            }

            const res = await fetch('/api/profile/integrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success('Entegrasyon ayarları kaydedildi');
                fetchSettings(); // Reload to get masked state
            } else {
                toast.error('Kaydedilemedi');
            }
        } catch (error) {
            toast.error('Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse h-48"></div>;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Server size={20} className="text-amber-500" />
                Source Control Entegrasyonları
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GitHub Settings */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl group focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                    <div className="flex items-center gap-3 mb-4 text-slate-800 dark:text-white font-bold">
                        <Github size={24} />
                        GitHub
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Personal Access Token (Gist)</label>
                        <div className="relative">
                            <input
                                type={showGithubToken ? "text" : "password"}
                                value={settings.githubAccessToken}
                                onChange={(e) => setSettings({ ...settings, githubAccessToken: e.target.value })}
                                placeholder="ghp_..."
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors pr-10"
                            />
                            <button
                                onClick={() => setShowGithubToken(!showGithubToken)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                {showGithubToken ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400">Gist oluşturma izni olan bir token girin.</p>
                    </div>
                </div>

                {/* Gitea Settings */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl group focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                    <div className="flex items-center gap-3 mb-4 text-slate-800 dark:text-white font-bold">
                        <img src="https://gitea.io/images/gitea.svg" alt="Gitea" className="w-6 h-6" /> {/* Generic Gitea Icon URL or similar */}
                        Gitea
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gitea Base URL</label>
                            <input
                                type="text"
                                value={settings.giteaBaseUrl}
                                onChange={(e) => setSettings({ ...settings, giteaBaseUrl: e.target.value })}
                                placeholder="https://git.example.com"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Personal Access Token</label>
                            <div className="relative">
                                <input
                                    type={showGiteaToken ? "text" : "password"}
                                    value={settings.giteaAccessToken}
                                    onChange={(e) => setSettings({ ...settings, giteaAccessToken: e.target.value })}
                                    placeholder="sha1_..."
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors pr-10"
                                />
                                <button
                                    onClick={() => setShowGiteaToken(!showGiteaToken)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    {showGiteaToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10"
                >
                    {saving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save size={18} />
                    )}
                    Ayarları Kaydet
                </button>
            </div>
        </div>
    );
}
