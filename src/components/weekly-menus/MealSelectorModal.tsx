"use client";

import { useState, useEffect } from "react";
import { X, Search, ChefHat, Plus } from "lucide-react";
import { Meal, MealCategory } from "@/types/meals";

interface MealSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (meal: Meal) => void;
    title?: string;
}

export default function MealSelectorModal({ isOpen, onClose, onSelect, title = "Izaberite Jelo" }: MealSelectorModalProps) {
    const [meals, setMeals] = useState<Meal[]>([]);
    const [categories, setCategories] = useState<MealCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            fetchData();
            setSearch("");
            setSelectedCategory("");
        }
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mealsRes, catsRes] = await Promise.all([
                fetch('/api/meals'),
                fetch('/api/meal-categories')
            ]);

            if (mealsRes.ok) {
                const data = await mealsRes.json();
                setMeals(data.meals || []);
            }

            if (catsRes.ok) {
                const data = await catsRes.json();
                setCategories(data.categories || []);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredMeals = meals.filter(meal => {
        const matchesSearch = meal.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory ? meal.category_id === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                    <h2 className="text-xl font-bold text-[#121333] flex items-center gap-2">
                        <ChefHat className="w-6 h-6 text-[#9cbe48]" />
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
                    <div className="relative">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Pretraži jela..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] focus:border-transparent transition-all"
                            autoFocus
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <button
                            onClick={() => setSelectedCategory("")}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${selectedCategory === ""
                                    ? "bg-[#121333] text-white border-[#121333]"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                }`}
                        >
                            Sve kategorije
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${selectedCategory === cat.id
                                        ? "bg-[#9cbe48] text-white border-[#9cbe48]"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="w-8 h-8 border-2 border-[#9cbe48] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredMeals.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Nema pronađenih jela</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {filteredMeals.map(meal => (
                                <button
                                    key={meal.id}
                                    onClick={() => onSelect(meal)}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group text-left"
                                >
                                    <div>
                                        <h3 className="font-semibold text-[#121333]">{meal.name}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-1">{meal.category?.name}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#9cbe48] group-hover:text-white transition-colors">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
