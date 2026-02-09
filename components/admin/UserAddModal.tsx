'use client';

import { X, UserPlus } from 'lucide-react';
import { useState } from 'react';

interface UserAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UserAddModal({ isOpen, onClose, onSuccess }: UserAddModalProps) {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setFormData({ name: '', email: '', password: '', role: 'user' });
                onSuccess();
                onClose();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Kullanıcı eklenemedi');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <UserPlus size={20} /> Yeni Kullanıcı Ekle
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 rounded text-sm">{error}</div>}

                    <div>
                        <label className="block text-sm font-medium mb-1">İsim</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Şifre</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Rol</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm">İptal</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Ekleniyor...' : 'Kullanıcıyı Oluştur'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}