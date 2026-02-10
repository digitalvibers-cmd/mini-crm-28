"use client";

import { useState, useEffect } from "react";
import { CreateMealInput, MealCategory, Ingredient, AddMealIngredientInput } from "@/types/meals";
import { X, Plus } from "lucide-react";

interface CreateMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface IngredientItem extends AddMealIngredientInput {
    ingredientName: string;
    ingredientUnit: string;
}

export default function CreateMealModal({
    isOpen,
    onClose,
    onSuccess
}: CreateMealModalProps) {
    const [categories, setCategories] = useState<MealCategory[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [formData, setFormData] = useState<CreateMealInput>({
        name: '',
        description: '',
        category_id: ''
    });

    // Ingredient selection
    const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
    const [ingredientQuantity, setIngredientQuantity] = useState<string>('');
    const [addedIngredients, setAddedIngredients] = useState<IngredientItem[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            fetchIngredients();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/meal-categories');
            if (!res.ok) throw new Error('Failed to fetch categories');
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const fetchIngredients = async () => {
        try {
            const res = await fetch('/api/ingredients');
            if (!res.ok) throw new Error('Failed to fetch ingredients');
            const data = await res.json();
            setIngredients(data.ingredients || []);
        } catch (err) {
            console.error('Error fetching ingredients:', err);
        }
    };

    const handleAddIngredient = () => {
        if (!selectedIngredientId || !ingredientQuantity || parseFloat(ingredientQuantity) <= 0) {
            setError('Izaberite namirnicu i unesite validnu količinu');
            return;
        }

        const ingredient = ingredients.find(i => i.id === selectedIngredientId);
        if (!ingredient) return;

        // Check if already added
        if (addedIngredients.some(i => i.ingredient_id === selectedIngredientId)) {
            setError('Ova namirnica je već dodata');
            return;
        }

        const newItem: IngredientItem = {
            ingredient_id: selectedIngredientId,
            quantity: parseFloat(ingredientQuantity),
            ingredientName: ingredient.name,
            ingredientUnit: ingredient.unit
        };

        setAddedIngredients([...addedIngredients, newItem]);
        setSelectedIngredientId('');
        setIngredientQuantity('');
        setError(null);
    };

    const handleRemoveIngredient = (ingredientId: string) => {
        setAddedIngredients(addedIngredients.filter(i => i.ingredient_id !== ingredientId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // First create the meal
            const mealRes = await fetch('/api/meals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const mealData = await mealRes.json();

            if (!mealRes.ok) {
                throw new Error(mealData.error || 'Failed to create meal');
            }

            // Then add ingredients if any
            if (addedIngredients.length > 0) {
                const mealId = mealData.meal.id;

                for (const item of addedIngredients) {
                    const ingredientRes = await fetch(`/api/meals/${mealId}/meal-ingredients`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ingredient_id: item.ingredient_id,
                            quantity: item.quantity
                        })
                    });

                    if (!ingredientRes.ok) {
                        console.error('Failed to add ingredient:', item.ingredientName);
                    }
                }
            }

            // Reset form
            setFormData({
                name: '',
                description: '',
                category_id: ''
            });
            setAddedIngredients([]);

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error creating meal:', err);
            setError(err instanceof Error ? err.message : 'Greška prilikom kreiranja jela');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setError(null);
            setAddedIngredients([]);
            onClose();
        }
    };

    if (!isOpen) return null;

    const selectedIngredient = ingredients.find(i => i.id === selectedIngredientId);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 rounded-t-3xl">
                    <h2 className="text-2xl font-bold text-[#121333]">Novo Jelo</h2>
                    <p className="text-slate-500 text-sm mt-1">Unesite osnovne informacije i dodajte sastojke</p>
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
                            Naziv Jela <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] focus:border-transparent"
                            placeholder="npr. Piletina sa povrćem"
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* Kategorija */}
                    <div>
                        <label className="block text-sm font-semibold text-[#121333] mb-2">
                            Kategorija <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] focus:border-transparent"
                            required
                            disabled={loading}
                        >
                            <option value="">-- Izaberi kategoriju --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Opis */}
                    <div>
                        <label className="block text-sm font-semibold text-[#121333] mb-2">
                            Opis
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] focus:border-transparent resize-none"
                            rows={3}
                            placeholder="Kratak opis jela..."
                            disabled={loading}
                        />
                    </div>

                    {/* Ingredients Section */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h3 className="text-sm font-bold text-[#121333] mb-3">Sastojci (opciono)</h3>

                        {/* Add Ingredient Form */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                {/* Ingredient Select */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Namirnica
                                    </label>
                                    <select
                                        value={selectedIngredientId}
                                        onChange={(e) => setSelectedIngredientId(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9cbe48] focus:border-transparent text-sm"
                                        disabled={loading}
                                    >
                                        <option value="">-- Izaberi --</option>
                                        {ingredients.map(ing => (
                                            <option key={ing.id} value={ing.id}>
                                                {ing.name} ({ing.unit})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Quantity Input */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Količina {selectedIngredient && `(${selectedIngredient.unit})`}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={ingredientQuantity}
                                            onChange={(e) => setIngredientQuantity(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9cbe48] focus:border-transparent text-sm"
                                            placeholder="0"
                                            min="0"
                                            step="0.01"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddIngredient}
                                            className="px-3 py-2 bg-[#9cbe48] text-white rounded-lg hover:bg-[#8bad3f] transition-colors disabled:opacity-50"
                                            disabled={loading || !selectedIngredientId || !ingredientQuantity}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Added Ingredients List */}
                            {addedIngredients.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <p className="text-xs font-semibold text-slate-600">Dodati sastojci:</p>
                                    {addedIngredients.map((item) => (
                                        <div
                                            key={item.ingredient_id}
                                            className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200"
                                        >
                                            <div className="flex-1">
                                                <span className="font-medium text-sm text-[#121333]">
                                                    {item.ingredientName}
                                                </span>
                                                <span className="text-slate-500 text-sm ml-2">
                                                    {item.quantity} {item.ingredientUnit}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveIngredient(item.ingredient_id)}
                                                className="text-red-500 hover:text-red-700 transition-colors p-1"
                                                disabled={loading}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Note */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-blue-700 text-sm">
                            💡 Možete dodati sastojke sada ili kasnije na detaljnoj stranici jela. Nutritivne vrednosti će biti automatski izračunate na osnovu sastojaka.
                        </p>
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
                            {loading ? 'Kreiranje...' : 'Kreiraj Jelo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
