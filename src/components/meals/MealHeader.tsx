import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { Meal } from "@/types/meals";

interface MealHeaderProps {
    meal: Meal;
    onEdit: () => void;
    onDelete: () => void;
}

export default function MealHeader({ meal, onEdit, onDelete }: MealHeaderProps) {
    const getCategoryColor = (categoryName: string) => {
        switch (categoryName?.toLowerCase()) {
            case 'doručak': return 'bg-orange-100 text-orange-700';
            case 'ručak': return 'bg-blue-100 text-blue-700';
            case 'večera': return 'bg-purple-100 text-purple-700';
            case 'užina': return 'bg-green-100 text-green-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Link
                href="/meals"
                className="inline-flex items-center text-slate-500 hover:text-[#121333] transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Nazad na listu jela
            </Link>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-[#121333] font-prata">
                            {meal.name}
                        </h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(meal.category?.name || '')}`}>
                            {meal.category?.name}
                        </span>
                    </div>
                    {meal.description && (
                        <p className="text-slate-500 max-w-2xl">
                            {meal.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <Edit className="w-4 h-4" />
                        Izmeni
                    </button>
                    <button
                        onClick={onDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Obriši
                    </button>
                </div>
            </div>
        </div>
    );
}
