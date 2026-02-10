"use client";

import { useState, useEffect } from "react";
import { Ingredient, MealIngredient } from "@/types/meals";
import { X, Plus, Search } from "lucide-react";

interface AddIngredientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    mealId: string;
    existingIngredients: MealIngredient[];
}

export default function AddIngredientModal({
    isOpen,
    onClose,
    onSuccess,
    mealId,
    existingIngredients
}: AddIngredientModalProps) {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Form state
    const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchIngredients();
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setSelectedIngredientId('');
        setQuantity('');
        setSearchTerm('');
        setError(null);
    };

    const fetchIngredients = async () => {
        try {
            setFetching(true);
            const res = await fetch('/api/ingredients');
            if (!res.ok) throw new Error('Failed to fetch ingredients');
            const data = await res.json();
            setIngredients(data.ingredients || []);
        } catch (err) {
            console.error('Error fetching ingredients:', err);
            setError('Greška prilikom učitavanja namirnica');
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIngredientId || !quantity || parseFloat(quantity) <= 0) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/meals/${mealId}/meal-ingredients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ingredient_id: selectedIngredientId,
                    quantity: parseFloat(quantity)
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to add ingredient');
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error adding ingredient:', err);
            setError(err instanceof Error ? err.message : 'Greška prilikom dodavanja sastojka');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Filter ingredients: 
    // 1. By search term
    // 2. Exclude already added ingredients
    const filteredIngredients = ingredients.filter(ing => {
        const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
        const alreadyAdded = existingIngredients.some(ei => ei.ingredient_id === ing.id);
        return matchesSearch && !alreadyAdded;
    });

    const selectedIngredient = ingredients.find(i => i.id === selectedIngredientId);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-[#121333]">Dodaj Sastojak</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        disabled={loading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Search & Select */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[#121333]">
                            Namirnica
                        </label>

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9cbe48]"
                                placeholder="Pretraži namirnice..."
                                disabled={loading}
                            />
                        </div>

                        {/* Dropdown Results */}
                        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl mt-2 divide-y divide-slate-50">
                            {fetching ? (
                                <div className="p-3 text-center text-slate-400 text-sm">Učitavanje...</div>
                            ) : filteredIngredients.length === 0 ? (
                                <div className="p-3 text-center text-slate-400 text-sm">
                                    {searchTerm ? 'Nema rezultata' : 'Sve namirnice su već dodate'}
                                </div>
                            ) : (
                                filteredIngredients.map(ing => (
                                    <button
                                        key={ing.id}
                                        type="button"
                                        onClick={() => setSelectedIngredientId(ing.id)}
                                        className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors flex justify-between items-center ${selectedIngredientId === ing.id ? 'bg-[#9cbe48]/10 text-[#9cbe48] font-medium' : 'text-slate-700'
                                            }`}
                                    >
                                        <span>{ing.name}</span>
                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                            {ing.unit}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-semibold text-[#121333] mb-2">
                            Količina {selectedIngredient && `(${selectedIngredient.unit})`}
                        </label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48]"
                            placeholder="Unesite količinu"
                            min="0"
                            step="0.01"
                            disabled={loading || !selectedIngredientId}
                            required
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                            disabled={loading}
                        >
                            Otkaži
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-[#9cbe48] text-white rounded-xl hover:bg-[#8bad3f] font-medium shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading || !selectedIngredientId || !quantity}
                        >
                            {loading ? 'Dodavanje...' : 'Dodaj Sastojak'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
