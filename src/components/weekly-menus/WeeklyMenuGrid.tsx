"use client";

import { useState } from "react";
import { WeeklyMenu, WeeklyMenuItem } from "@/types/weekly-menu";
import { MealCategory } from "@/types/meals";
import { Plus, Trash2, Calendar as CalendarIcon, Utensils } from "lucide-react";
import { format, addDays, parseISO, startOfISOWeek } from "date-fns";
import { srLatn } from "date-fns/locale";
import MealSelectorModal from "./MealSelectorModal";
import { Meal } from "@/types/meals";

interface WeeklyMenuGridProps {
    menu: WeeklyMenu;
    items: WeeklyMenuItem[];
    categories: MealCategory[];
    onAddItem: (day: number, categoryId: string, meal: Meal) => Promise<void>;
    onRemoveItem: (itemId: string) => Promise<void>;
}

export default function WeeklyMenuGrid({ menu, items, categories, onAddItem, onRemoveItem }: WeeklyMenuGridProps) {
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ day: number; categoryId: string } | null>(null);

    // Days 1-7 (Mon-Sun)
    const days = [1, 2, 3, 4, 5, 6, 7];

    // Calculate dates for column headers
    const startDate = parseISO(menu.start_date);

    const getItemsForSlot = (day: number, categoryId: string) => {
        return items.filter(item => item.day_of_week === day && item.meal_category_id === categoryId);
    };

    const handleAddClick = (day: number, categoryId: string) => {
        setSelectedSlot({ day, categoryId });
        setSelectorOpen(true);
    };

    const handleMealSelect = async (meal: Meal) => {
        if (selectedSlot) {
            await onAddItem(selectedSlot.day, selectedSlot.categoryId, meal);
            setSelectorOpen(false);
            setSelectedSlot(null);
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Grid Header - Days */}
            <div className="grid grid-cols-[150px_repeat(7,_1fr)] border-b border-slate-100 bg-slate-50/50">
                <div className="p-4 flex items-center justify-center border-r border-slate-100 text-slate-400 font-medium text-sm">
                    Kategorija / Dan
                </div>
                {days.map(day => {
                    const date = addDays(startDate, day - 1);
                    const isToday = new Date().toDateString() === date.toDateString();

                    return (
                        <div key={day} className={`p-4 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-emerald-50/50' : ''}`}>
                            <div className={`text-sm font-bold uppercase mb-1 ${isToday ? 'text-[#9cbe48]' : 'text-[#121333]'}`}>
                                {format(date, 'EEEE', { locale: srLatn })}
                            </div>
                            <div className={`text-xs ${isToday ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                {format(date, 'd. MMM', { locale: srLatn })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Grid Body - Categories */}
            <div className="divide-y divide-slate-100">
                {categories.map(category => (
                    <div key={category.id} className="grid grid-cols-[150px_repeat(7,_1fr)] min-h-[140px] group/row">
                        {/* Category Header (Row Label) */}
                        <div className="p-4 flex flex-col justify-center items-center border-r border-slate-100 bg-slate-50/30">
                            <span className="font-bold text-[#121333] text-sm text-center">{category.name}</span>
                        </div>

                        {/* Days Slots */}
                        {days.map(day => {
                            const slotItems = getItemsForSlot(day, category.id);
                            const date = addDays(startDate, day - 1);
                            const isToday = new Date().toDateString() === date.toDateString();

                            return (
                                <div
                                    key={`${category.id}-${day}`}
                                    className={`relative p-2 border-r border-slate-100 last:border-r-0 flex flex-col gap-2 group/cell transition-colors hover:bg-slate-50/50 ${isToday ? 'bg-emerald-50/10' : ''}`}
                                >
                                    {/* Items List */}
                                    {slotItems.map(item => (
                                        <div
                                            key={item.id}
                                            className="bg-white border border-slate-200 rounded-lg p-2 shadow-sm text-sm relative group/item hover:border-[#9cbe48] transition-colors"
                                        >
                                            <div className="font-medium text-[#121333] pr-4 leading-tight">
                                                {item.meal?.name}
                                            </div>
                                            <button
                                                onClick={() => onRemoveItem(item.id)}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-red-100 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 shadow-sm hover:bg-red-50 transition-all"
                                                title="Ukloni jelo"
                                            >
                                                <XIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Add Button */}
                                    <button
                                        onClick={() => handleAddClick(day, category.id)}
                                        className={`mt-auto w-full py-1.5 rounded-lg border border-dashed border-slate-200 text-slate-400 hover:text-[#9cbe48] hover:border-[#9cbe48] hover:bg-[#9cbe48]/5 transition-all text-xs font-medium flex items-center justify-center gap-1 opacity-0 group-hover/cell:opacity-100 ${slotItems.length === 0 ? 'opacity-100' : ''}`}
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Dodaj
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <MealSelectorModal
                isOpen={selectorOpen}
                onClose={() => setSelectorOpen(false)}
                onSelect={handleMealSelect}
                title={`Dodaj Jelo`}
            />
        </div>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}
