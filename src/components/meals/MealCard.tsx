import Link from "next/link";
import { Meal } from "@/types/meals";

interface MealCardProps {
    meal: Meal;
    onEdit: (meal: Meal) => void;
    onDelete: (meal: Meal) => void;
}

export default function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
    // Category badge colors
    const categoryColors: Record<string, string> = {
        'Doručak': 'bg-amber-100 text-amber-700 border-amber-200',
        'Ručak': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Večera': 'bg-blue-100 text-blue-700 border-blue-200',
        'Užina 1': 'bg-purple-100 text-purple-700 border-purple-200',
        'Užina 2': 'bg-pink-100 text-pink-700 border-pink-200',
    };

    const categoryName = meal.category?.name || 'N/A';
    const categoryColor = categoryColors[categoryName] || 'bg-slate-100 text-slate-700 border-slate-200';

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <Link href={`/meals/${meal.id}`} className="block">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 group-hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-[#121333] mb-2 group-hover:text-blue-600 transition-colors">
                                {meal.name}
                            </h3>
                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${categoryColor}`}>
                                {categoryName}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {meal.description && (
                    <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100">
                        <p className="text-sm text-slate-600 line-clamp-2">{meal.description}</p>
                    </div>
                )}

                {/* Nutrition Info */}
                <div className="px-5 py-4 grid grid-cols-4 gap-3 bg-white">
                    <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">Kalorije</div>
                        <div className="text-lg font-bold text-[#121333]">
                            {meal.calories || '-'}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">Proteini</div>
                        <div className="text-lg font-bold text-emerald-600">
                            {meal.protein ? `${meal.protein}g` : '-'}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">Ugljeni</div>
                        <div className="text-lg font-bold text-amber-600">
                            {meal.carbs ? `${meal.carbs}g` : '-'}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">Masti</div>
                        <div className="text-lg font-bold text-blue-600">
                            {meal.fats ? `${meal.fats}g` : '-'}
                        </div>
                    </div>
                </div>
            </Link>

            {/* Actions */}
            <div className="px-5 py-3 bg-slate-50 flex gap-2">
                <button
                    onClick={() => onEdit(meal)}
                    className="flex-1 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                >
                    Izmeni
                </button>
                <button
                    onClick={() => onDelete(meal)}
                    className="flex-1 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                    Obriši
                </button>
            </div>
        </div>
    );
}
