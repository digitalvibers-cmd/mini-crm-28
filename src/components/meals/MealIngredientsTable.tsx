import { MealIngredient } from "@/types/meals";
import { Plus, Trash2 } from "lucide-react";

interface MealIngredientsTableProps {
    ingredients: MealIngredient[];
    onAdd: () => void;
    onRemove: (ingredientId: string) => void;
    loading?: boolean;
}

export default function MealIngredientsTable({
    ingredients,
    onAdd,
    onRemove,
    loading = false
}: MealIngredientsTableProps) {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#121333]">Sastojci (Normativ)</h3>
                <button
                    onClick={onAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-[#9cbe48] text-white rounded-xl hover:bg-[#8bad3f] transition-colors shadow-lg shadow-emerald-100"
                    disabled={loading}
                >
                    <Plus className="w-4 h-4" />
                    Dodaj Sastojak
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Namirnica
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Kategorija
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Količina
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Akcije
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {ingredients.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                    Nema dodatih sastojaka za ovo jelo.
                                </td>
                            </tr>
                        ) : (
                            ingredients.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-[#121333]">
                                        {item.ingredient?.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                            {item.ingredient?.category || 'Ostalo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#121333] text-right font-mono">
                                        {item.quantity} <span className="text-slate-500">{item.ingredient?.unit}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => onRemove(item.ingredient_id)}
                                            className="text-red-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                            title="Ukloni sastojak"
                                            disabled={loading}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Summary (Optional Future Feature) */}
            {ingredients.length > 0 && (
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                        Ukupno sastojaka: <span className="font-semibold text-[#121333]">{ingredients.length}</span>
                    </p>
                </div>
            )}
        </div>
    );
}
