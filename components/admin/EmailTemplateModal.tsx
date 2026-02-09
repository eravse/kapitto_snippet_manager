'use client';

import { useState, useEffect } from 'react';
import { X, Save, Mail, Code, Eye, Edit3, Trash2, Info, Link } from 'lucide-react';
import { toast } from 'sonner';

interface EmailTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: any;
    onSuccess: () => void;
}

const VARIABLES: Record<string, string[]> = {
    USER: ['name', 'email', 'reset_link', 'role'],
    SNIPPET: ['title', 'author', 'language', 'link'],
    SYSTEM: ['site_name', 'admin_name', 'update_date']
};

const LINKS = ['site_url', 'login_url', 'dashboard_url'];

export default function EmailTemplateModal({ isOpen, onClose, template, onSuccess }: EmailTemplateModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        content: '',
        context: 'SYSTEM'
    });
    const [isPreview, setIsPreview] = useState(false);
    const [previewData, setPreviewData] = useState({ subject: '', content: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [isRendering, setIsRendering] = useState(false);

    useEffect(() => {
        if (template) {
            setFormData({
                name: template.name || '',
                subject: template.subject || '',
                content: template.content || '',
                context: template.context || 'SYSTEM'
            });
            setIsPreview(false);
        }
    }, [template]);

    const handlePreview = async () => {
        if (isPreview) {
            setIsPreview(false);
            return;
        }

        setIsRendering(true);
        try {
            const res = await fetch('/api/admin/email-templates/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: formData.subject,
                    content: formData.content,
                    context: formData.context
                })
            });
            const data = await res.json();
            if (res.ok) {
                setPreviewData(data);
                setIsPreview(true);
            } else {
                toast.error('Ön izleme oluşturulamadı');
            }
        } catch (e) {
            toast.error('Bağlantı hatası');
        } finally {
            setIsRendering(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch(`/api/admin/email-templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: template.id,
                    name: formData.name,
                    subject: formData.subject,
                    content: formData.content,
                    context: formData.context
                }),
            });

            if (res.ok) {
                toast.success('Şablon başarıyla kaydedildi');
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Kaydetme hatası');
            }
        } catch (error) {
            toast.error('Bağlantı hatası oluştu');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !template) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Mail size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black">{template.id ? 'Şablon Düzenle' : 'Yeni Şablon'}</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{formData.name || 'Yeni Şablon'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePreview}
                            disabled={isRendering}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isPreview ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                        >
                            {isRendering ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : isPreview ? <Edit3 size={14} /> : <Eye size={14} />}
                            {isPreview ? 'Düzenlemeye Dön' : 'Ön İzleme'}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {isPreview ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Konu</p>
                                <p className="text-xl font-bold">{previewData.subject}</p>
                            </div>
                            <div className="p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner min-h-[300px] whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300">
                                {previewData.content}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium justify-center">
                                <Info size={12} />
                                <span>Bu bir ön izlemedir. Değişkenler örnek verilerle doldurulmuştur.</span>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Şablon İsmi (Unique)</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!!template.id}
                                        placeholder="password_reset"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold disabled:opacity-50"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Bağlam (Context)</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                                        value={formData.context}
                                        onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                                    >
                                        <option value="SYSTEM">Sistem</option>
                                        <option value="USER">Kullanıcı</option>
                                        <option value="SNIPPET">Snippet</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">E-Posta Konusu</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">İçerik (Markdown/Metin)</label>
                                    <textarea
                                        required
                                        rows={12}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    />
                                </div>
                                <div className="w-full md:w-64 space-y-4">
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 mb-4 text-blue-500">
                                            <Code size={16} />
                                            <span className="text-xs font-black uppercase tracking-widest">Değişkenler</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {VARIABLES[formData.context as keyof typeof VARIABLES]?.map(v => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, content: formData.content + `{{${v}}}` })}
                                                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold hover:border-blue-500 transition-all"
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2 mb-4 text-emerald-500">
                                            <Link size={16} />
                                            <span className="text-xs font-black uppercase tracking-widest">Sistem Linkleri</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {LINKS.map(v => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, content: formData.content + `{{${v}}}` })}
                                                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold hover:border-emerald-500 transition-all text-emerald-600"
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="mt-4 text-[10px] text-slate-400 leading-relaxed">
                                            Değişkenleri metne eklemek için kutucuklara tıklayabilirsiniz.
                                        </p>
                                    </div>
                                </div>
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
                                    className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            Şablonu Kaydet
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
