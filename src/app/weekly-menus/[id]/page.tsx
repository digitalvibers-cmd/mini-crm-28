"use client";

import { useState, useEffect, use } from "react";
import { WeeklyMenu, WeeklyMenuItem } from "@/types/weekly-menu";
import { MealCategory, Meal } from "@/types/meals";
import WeeklyMenuGrid from "@/components/weekly-menus/WeeklyMenuGrid";
import { ArrowLeft, Calendar, Loader2, Utensils } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { srLatn } from "date-fns/locale";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function WeeklyMenuDetailsPage({ params }: PageProps) {
    const { id } = use(params);
    const [menu, setMenu] = useState<WeeklyMenu | null>(null);
    const [items, setItems] = useState<WeeklyMenuItem[]>([]);
    const [categories, setCategories] = useState<MealCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        fetchCategories();
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/weekly-menus/${id}`);
            if (!res.ok) throw new Error('Failed to fetch menu');
            const data = await res.json();
            setMenu(data.menu);
            setItems(data.menu.items || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/meal-categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data.categories || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddItem = async (day: number, categoryId: string, meal: Meal) => {
        try {
            const res = await fetch(`/api/weekly-menus/${id}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    day_of_week: day,
                    meal_category_id: categoryId,
                    meal_id: meal.id
                })
            });

            if (res.ok) {
                const { item } = await res.json();
                // Optimistic update or refetch?
                // The API returns the single item with joins, so we can append it
                setItems(prev => [...prev, item]);
            }
        } catch (err) {
            console.error('Failed to add item', err);
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        // Optimistic update
        const previousItems = [...items];
        setItems(prev => prev.filter(i => i.id !== itemId));

        try {
            const res = await fetch(`/api/weekly-menus/${id}/items?id=${itemId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                // Revert on failure
                setItems(previousItems);
                throw new Error('Failed to delete');
            }
        } catch (err) {
            console.error('Failed to remove item', err);
            setItems(previousItems);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#9cbe48]" />
            </div>
        );
    }

    if (!menu) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold">Jelovnik nije pronađen</h2>
                <Link href="/weekly-menus" className="text-blue-500 hover:underline mt-4 inline-block">
                    Nazad na listu
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/weekly-menus"
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-[#121333] flex items-center gap-3">
                            {menu.name}
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(parseISO(menu.start_date), 'd. MMM', { locale: srLatn })} - {format(parseISO(menu.end_date), 'd. MMM', { locale: srLatn })}
                            </span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Program: <span className="font-medium text-slate-700">{menu.program?.name}</span>
                        </p>
                    </div>
                </div>

                <Link
                    href={`/weekly-menus/${id}/shopping-list`}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium shadow-sm"
                >
                    <Utensils className="w-4 h-4" />
                    Lista za Kupovinu
                </Link>
            </div>

            {/* Grid */}
            <WeeklyMenuGrid
                menu={menu}
                items={items}
                categories={categories}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
            />
        </div>
    );
}
