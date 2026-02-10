"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Meal, MealIngredient } from "@/types/meals";
import MealHeader from "@/components/meals/MealHeader";
import MealIngredientsTable from "@/components/meals/MealIngredientsTable";
import AddIngredientModal from "@/components/meals/AddIngredientModal";

export default function MealDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [meal, setMeal] = useState<Meal | null>(null);
    const [ingredients, setIngredients] = useState<MealIngredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modals
    const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
    const [isEditMealOpen, setIsEditMealOpen] = useState(false);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [mealRes, ingredientsRes] = await Promise.all([
                fetch(`/api/meals/${id}`),
                fetch(`/api/meals/${id}/meal-ingredients`)
            ]);

            if (!mealRes.ok) throw new Error('Failed to fetch meal details');

            const mealData = await mealRes.json();
            const ingredientsData = await ingredientsRes.json();

            setMeal(mealData.meal);
            setIngredients(ingredientsData.ingredients || []);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Greška prilikom učitavanja podataka');
        } finally {
            setLoading(false);
        }
    };

    const handleIngredientAdded = () => {
        fetchData(); // Refresh data
    };

    const handleRemoveIngredient = async (ingredientId: string) => {
        if (!confirm('Da li ste sigurni da želite da uklonite ovaj sastojak?')) return;

        try {
            const res = await fetch(`/api/meals/${id}/meal-ingredients?ingredient_id=${ingredientId}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Failed to remove ingredient');

            fetchData(); // Refresh list
        } catch (err) {
            console.error('Error removing ingredient:', err);
            alert('Greška prilikom brisanja sastojka');
        }
    };

    const handleDeleteMeal = async () => {
        if (!confirm('Da li ste sigurni da želite da obrišete ovo jelo? Ovo je trajna akcija.')) return;

        try {
            const res = await fetch(`/api/meals/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Failed to delete meal');

            router.push('/meals');
        } catch (err) {
            console.error('Error deleting meal:', err);
            alert('Greška prilikom brisanja jela');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9cbe48]"></div>
            </div>
        );
    }

    if (error || !meal) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Greška</h2>
                <p className="text-slate-500">{error || 'Jelo nije pronađeno'}</p>
                <button
                    onClick={() => router.push('/meals')}
                    className="mt-4 text-[#9cbe48] font-medium hover:underline"
                >
                    Nazad na listu
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <MealHeader
                meal={meal}
                onEdit={() => setIsEditMealOpen(true)}
                onDelete={handleDeleteMeal}
            />

            {/* Ingredients Table */}
            <MealIngredientsTable
                ingredients={ingredients}
                onAdd={() => setIsAddIngredientOpen(true)}
                onRemove={handleRemoveIngredient}
            />

            {/* Modals */}
            <AddIngredientModal
                isOpen={isAddIngredientOpen}
                onClose={() => setIsAddIngredientOpen(false)}
                onSuccess={handleIngredientAdded}
                mealId={id}
                existingIngredients={ingredients}
            />
        </div>
    );
}
