"use client";

import { useState, useEffect } from "react";
import { Ingredient } from "@/types/meals";
import CreateIngredientModal from "@/components/ingredients/CreateIngredientModal";
import EditIngredientModal from "@/components/ingredients/EditIngredientModal";
import DeleteConfirmModal from "@/components/shared/DeleteConfirmModal";

export default function IngredientsPage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        fetchIngredients();
    }, []);

    const fetchIngredients = async () => {
        try {
            const res = await fetch('/api/ingredients');
            if (!res.ok) {
                throw new Error('Failed to fetch ingredients');
            }
            const data = await res.json();
            setIngredients(data.ingredients || []);
        } catch (err) {
            console.error('Error fetching ingredients:', err);
            setError('Greška prilikom učitavanja namirnica');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (ingredient: Ingredient) => {
        setSelectedIngredient(ingredient);
        setShowEditModal(true);
    };

    const handleDeleteClick = (ingredient: Ingredient) => {
        setSelectedIngredient(ingredient);
        setDeleteError(null);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedIngredient) return;

        setDeleteLoading(true);
        setDeleteError(null);

        try {
            const res = await fetch(`/api/ingredients/${selectedIngredient.id}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete ingredient');
            }

            // Success - close modal and refresh
            setShowDeleteModal(false);
            setSelectedIngredient(null);
            fetchIngredients();
        } catch (err) {
            console.error('Error deleting ingredient:', err);
            setDeleteError(err instanceof Error ? err.message : 'Greška prilikom brisanja namirnice');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-400">Učitavanje namirnica...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <p className="text-red-600 font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#121333]">Namirnice</h1>
                    <p className="text-slate-500 mt-1">Baza namirnica za kreiranje jela</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-[#9cbe48] text-white rounded-xl hover:bg-[#8bad3f] transition-colors font-medium shadow-lg shadow-emerald-100"
                >
                    + Nova Namirnica
                </button>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="text-sm text-slate-500">Ukupno namirnica</div>
                <div className="text-3xl font-bold text-[#121333] mt-1">{ingredients.length}</div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#121333] text-white">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Naziv</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Jedinica</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Kategorija</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Napomene</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold">Akcije</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ingredients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        Nema namirnica u bazi
                                    </td>
                                </tr>
                            ) : (
                                ingredients.map((ingredient) => (
                                    <tr key={ingredient.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-[#121333]">
                                            {ingredient.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <span className="px-3 py-1 bg-slate-100 rounded-full text-sm font-medium">
                                                {ingredient.unit}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {ingredient.category || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {ingredient.notes || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(ingredient)}
                                                    className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                                                >
                                                    Izmeni
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(ingredient)}
                                                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                                                >
                                                    Obriši
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            <CreateIngredientModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={fetchIngredients}
            />

            {/* Edit Modal */}
            <EditIngredientModal
                isOpen={showEditModal}
                ingredient={selectedIngredient}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedIngredient(null);
                }}
                onSuccess={fetchIngredients}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={showDeleteModal}
                title="Obriši Namirnicu"
                message="Da li ste sigurni da želite da obrišete ovu namirnicu?"
                itemName={selectedIngredient?.name}
                onConfirm={handleDeleteConfirm}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setSelectedIngredient(null);
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
