'use client';

import { useState, useEffect } from 'react';
import { X, Save, Shield, User, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface UserEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onSuccess: () => void;
}

export default function UserEditModal({ isOpen, onClose, user, onSuccess }: UserEditModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        role: 'user',
        isActive: true
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                role: user.role || 'user',
                isActive: user.isActive !== undefined ? user.isActive : true
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success('Kullanıcı başarıyla güncellendi');
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Güncelleme hatası');
            }
        } catch (error) {
            toast.error('Bağlantı hatası oluştu');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black">Kullanıcıyı Düzenle</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tam İsim</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Rol</label>
                            <select
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="user">Standart Kullanıcı</option>
                                <option value="admin">Yönetici (Admin)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Durum</label>
                            <div className="flex items-center h-[52px]">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                    className={`w-full h-full flex items-center justify-center gap-2 rounded-xl font-bold transition-all border ${formData.isActive
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                        : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                                        }`}
                                >
                                    {formData.isActive ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                    {formData.isActive ? 'Aktif' : 'Pasif'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-4">
                        <div className="flex gap-3">
                            <Shield size={20} className="text-amber-500 shrink-0" />
                            <p className="text-[11px] font-medium leading-relaxed text-amber-700 dark:text-amber-400">
                                Hesap rolünü değiştirmek kullanıcının tüm yetkilerini etkiler. Lütfen bu işlemi dikkatli yapın.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={async () => {
                                if (confirm('Bu kullanıcıya şifre sıfırlama maili gönderilsin mi?')) {
                                    try {
                                        const res = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: 'POST' });
                                        const data = await res.json();
                                        if (res.ok) toast.success(data.message);
                                        else toast.error(data.error);
                                    } catch (e) {
                                        toast.error('Mail gönderilemedi');
                                    }
                                }
                            }}
                            className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={14} /> Şifre Sıfırlama Maili Gönder
                        </button>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-all"
                        >
                            Vazgeç
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} />
                                    Değişiklikleri Kaydet
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
