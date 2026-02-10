"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Printer, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

interface ShoppingListItem {
    ingredient_id: string;
    name: string;
    quantity: number;
    unit: string;
    category: string;
}

interface ShoppingListResponse {
    shoppingList: Record<string, ShoppingListItem[]>;
    totalItems: number;
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ShoppingListPage({ params }: PageProps) {
    const { id } = use(params);
    const [list, setList] = useState<Record<string, ShoppingListItem[]> | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchList = async () => {
            try {
                const res = await fetch(`/api/weekly-menus/${id}/shopping-list`);
                if (res.ok) {
                    const data: ShoppingListResponse = await res.json();
                    setList(data.shoppingList);
                }
            } catch (err) {
                console.error('Failed to fetch shopping list', err);
            } finally {
                setLoading(false);
            }
        };

        fetchList();
    }, [id]);

    const toggleItem = (id: string) => {
        const newChecked = new Set(checkedItems);
        if (newChecked.has(id)) {
            newChecked.delete(id);
        } else {
            newChecked.add(id);
        }
        setCheckedItems(newChecked);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#9cbe48] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!list || Object.keys(list).length === 0) {
        return (
            <div className="p-8 text-center max-w-md mx-auto mt-20">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Printer className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-[#121333] mb-2">Lista je prazna</h2>
                <p className="text-slate-500 mb-6">Izgleda da nema dodatih jela u ovom nedeljnom meniju, pa nema ni sastojaka za kupovinu.</p>
                <Link
                    href={`/weekly-menus/${id}`}
                    className="inline-flex items-center justify-center px-6 py-2.5 bg-[#9cbe48] text-white rounded-xl font-medium hover:bg-[#8bad3f] transition-all"
                >
                    Nazad na Jelovnik
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 print:max-w-none print:p-0">
            {/* Header - Hidden in Print */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/weekly-menus/${id}`}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-[#121333]">Lista za Kupovinu</h1>
                        <p className="text-slate-500 text-sm">Generisano na osnovu nedeljnog plana</p>
                    </div>
                </div>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium shadow-sm"
                >
                    <Printer className="w-4 h-4" />
                    Štampaj
                </button>
            </div>

            {/* Print Header - Visible only in Print */}
            <div className="hidden print:block mb-8 text-center border-b border-black pb-4">
                <h1 className="text-2xl font-bold mb-1">Lista za Kupovinu</h1>
                <p className="text-sm text-gray-500">Swift Orbit - Nedeljni Plan</p>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-8">
                {Object.entries(list).map(([category, items]) => (
                    <div key={category} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm print:shadow-none print:border-gray-200 break-inside-avoid">
                        <h3 className="font-bold text-[#121333] mb-4 pb-2 border-b border-slate-50 print:border-gray-100 flex items-center justify-between">
                            {category}
                            <span className="text-xs font-normal text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full print:hidden">
                                {items.length}
                            </span>
                        </h3>
                        <ul className="space-y-3">
                            {items.map((item) => {
                                const isChecked = checkedItems.has(item.ingredient_id);
                                return (
                                    <li
                                        key={item.ingredient_id}
                                        className={`flex items-start gap-3 group cursor-pointer select-none transition-opacity ${isChecked ? 'opacity-40 line-through' : 'opacity-100'
                                            }`}
                                        onClick={() => toggleItem(item.ingredient_id)}
                                    >
                                        <div className={`mt-0.5 rounded-full w-5 h-5 flex items-center justify-center shrink-0 border transition-colors print:border-gray-400 ${isChecked
                                                ? 'bg-[#9cbe48] border-[#9cbe48] text-white'
                                                : 'bg-white border-slate-300 text-transparent group-hover:border-[#9cbe48]'
                                            }`}>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <span className="font-medium text-slate-700 print:text-black">
                                                    {item.name}
                                                </span>
                                                <span className="text-sm font-semibold text-[#9cbe48] whitespace-nowrap print:text-black">
                                                    {item.quantity} {item.unit}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
