"use client";

import { useState } from "react";

interface EditClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: {
        id: string;
        name: string;
        email: string;
        phone: string;
        address: string;
    };
    onSuccess: () => void;
}

export function EditClientModal({ isOpen, onClose, client, onSuccess }: EditClientModalProps) {
    const [formData, setFormData] = useState({
        first_name: client.name.split(' ')[0] || '',
        last_name: client.name.split(' ').slice(1).join(' ') || '',
        email: client.email,
        phone: client.phone || '',
        address: client.address || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch(`/api/clients/${encodeURIComponent(client.id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update client');
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Failed to update client:', err);
            setError(err instanceof Error ? err.message : 'Failed to update client');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-6 rounded-t-3xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-[#121333]">Izmeni Klijenta</h2>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {/* First Name */}
                    <div>
                        <label className="block text-sm font-bold text-[#121333] mb-2">
                            Ime *
                        </label>
                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-[#9cbe48] text-[#121333] placeholder:text-slate-400"
                            placeholder="Unesi ime"
                        />
                    </div>

                    {/* Last Name */}
                    <div>
                        <label className="block text-sm font-bold text-[#121333] mb-2">
                            Prezime *
                        </label>
                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-[#9cbe48] text-[#121333] placeholder:text-slate-400"
                            placeholder="Unesi prezime"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-bold text-[#121333] mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-[#9cbe48] text-[#121333] placeholder:text-slate-400"
                            placeholder="primer@email.com"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-bold text-[#121333] mb-2">
                            Telefon
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-[#9cbe48] text-[#121333] placeholder:text-slate-400"
                            placeholder="063 123 456"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-bold text-[#121333] mb-2">
                            Adresa
                        </label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-[#9cbe48] text-[#121333] placeholder:text-slate-400 resize-none"
                            placeholder="Bulevar Evrope 10"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                        >
                            Otkaži
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-[#9cbe48] text-white rounded-xl hover:bg-[#8bad3f] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-100"
                        >
                            {loading ? 'Čuvanje...' : 'Sačuvaj Izmene'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
