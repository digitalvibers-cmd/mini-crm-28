"use client";

import { useState } from "react";
import { CreateIngredientInput, IngredientUnit } from "@/types/meals";

interface CreateIngredientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const UNITS: IngredientUnit[] = ['kg', 'g', 'L', 'ml', 'kom', 'pakovanje'];

const CATEGORIES = [
    'Meso',
    'Povrće',
    'Voće',
    'Žitarice',
    'Mlečni proizvodi',
    'Začini',
    'Namirnice',
    'Ostalo'
];

export default function CreateIngredientModal({
    isOpen,
    onClose,
    onSuccess
}: CreateIngredientModalProps) {
    const [formData, setFormData] = useState<CreateIngredientInput>({
        name: '',
        unit: 'kg',
        category: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch('/api/ingredients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create ingredient');
            }

            // Reset form
            setFormData({
                name: '',
                unit: 'kg',
                category: '',
                notes: ''
            });

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error creating ingredient:', err);
            setError(err instanceof Error ? err.message : 'Greška prilikom kreiranja namirnice');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setError(null);
            setFormData({
                name: '',
                unit: 'kg',
                category: '',
                notes: ''
            });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 rounded-t-3xl">
                    <h2 className="text-2xl font-bold text-[#121333]">Nova Namirnica</h2>
                    <p className="text-slate-500 text-sm mt-1">Dodaj novu namirnicu u bazu</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Error Alert */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <p className="text-red-600 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* Naziv */}
                    <div>
                        <label className="block text-sm font-semibold text-[#121333] mb-2">
                            Naziv <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] focus:border-transparent"
                            placeholder="npr. Pileće belo meso"
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* Jedinica Mere */}
                    <div>
                        <label className="block text-sm font-semibold text-[#121333] mb-2">
                            Jedinica Mere <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value as IngredientUnit })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] focus:border-transparent"
                            required
                            disabled={loading}
                        >
                            {UNITS.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </select>
                    </div>

                    {/* Kategorija */}
                    <div>
                        <label className="block text-sm font-semibold text-[#121333] mb-2">
                            Kategorija
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] focus:border-transparent"
                            disabled={loading}
                        >
                            <option value="">-- Izaberi kategoriju --</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Napomene */}
                    <div>
                        <label className="block text-sm font-semibold text-[#121333] mb-2">
                            Napomene
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] focus:border-transparent resize-none"
                            rows={3}
                            placeholder="Dodatne informacije..."
                            disabled={loading}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                            disabled={loading}
                        >
                            Otkaži
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-[#9cbe48] text-white rounded-xl hover:bg-[#8bad3f] transition-colors font-medium shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Kreiranje...' : 'Kreiraj'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
