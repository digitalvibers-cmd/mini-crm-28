"use client";

import { useState, useEffect } from "react";
import { Meal, MealCategory } from "@/types/meals";
import MealCard from "@/components/meals/MealCard";
import CreateMealModal from "@/components/meals/CreateMealModal";
import DeleteConfirmModal from "@/components/shared/DeleteConfirmModal";

export default function MealsPage() {
    const [meals, setMeals] = useState<Meal[]>([]);
    const [categories, setCategories] = useState<MealCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
        fetchMeals();
    }, []);

    useEffect(() => {
        fetchMeals();
    }, [searchQuery, selectedCategory]);

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

    const fetchMeals = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (selectedCategory) params.append('category', selectedCategory);

            const res = await fetch(`/api/meals?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch meals');

            const data = await res.json();
            setMeals(data.meals || []);
        } catch (err) {
            console.error('Error fetching meals:', err);
            setError('Greška prilikom učitavanja jela');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (meal: Meal) => {
        // TODO: Implement edit modal
        alert('Edit funkcionalnost uskoro!');
    };

    const handleDeleteClick = (meal: Meal) => {
        setSelectedMeal(meal);
        setDeleteError(null);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedMeal) return;

        setDeleteLoading(true);
        setDeleteError(null);

        try {
            const res = await fetch(`/api/meals/${selectedMeal.id}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete meal');
            }

            // Success
            setShowDeleteModal(false);
            setSelectedMeal(null);
            fetchMeals();
        } catch (err) {
            console.error('Error deleting meal:', err);
            setDeleteError(err instanceof Error ? err.message : 'Greška prilikom brisanja jela');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading && meals.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-400">Učitavanje jela...</div>
            </div>
        );
    }

    if (error && meals.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#121333]">Jela</h1>
                    <p className="text-slate-500 mt-1">Upravljanje jelima i receptima</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-[#9cbe48] text-white rounded-xl hover:bg-[#8bad3f] transition-colors font-medium shadow-lg shadow-emerald-100"
                >
                    + Novo Jelo
                </button>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="text-sm text-slate-500">Ukupno jela</div>
                <div className="text-3xl font-bold text-[#121333] mt-1">{meals.length}</div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="🔍 Pretraži jela..."
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] focus:border-transparent"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="md:w-64">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] focus:border-transparent"
                        >
                            <option value="">Sve kategorije</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Meals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meals.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-400">
                        {searchQuery || selectedCategory ? 'Nema jela koja odgovaraju kriterijumima' : 'Nema jela u bazi'}
                    </div>
                ) : (
                    meals.map((meal) => (
                        <MealCard
                            key={meal.id}
                            meal={meal}
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                        />
                    ))
                )}
            </div>

            {/* Create Modal */}
            <CreateMealModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={fetchMeals}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={showDeleteModal}
                title="Obriši Jelo"
                message="Da li ste sigurni da želite da obrišete ovo jelo?"
                itemName={selectedMeal?.name}
                onConfirm={handleDeleteConfirm}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setSelectedMeal(null);
                    setDeleteError(null);
                }}
                loading={deleteLoading}
            />

            {/* Delete Error Alert */}
            {deleteError && showDeleteModal && (
                <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg max-w-md z-[60]">
                    <p className="text-red-600 font-medium">{deleteError}</p>
                </div>
            )}
        </div>
    );
}
