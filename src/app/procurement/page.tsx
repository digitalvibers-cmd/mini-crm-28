"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Calendar,
    ShoppingCart,
    Copy,
    Plus,
    Trash2,
    CheckSquare,
    Square,
    FileText,
    Utensils,
    Package
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---

interface Order {
    id: string;
    product: string;
    startDate: string;
    duration: string;
    note?: string;
}

interface ShoppingItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    supplier: string;
    checked: boolean;
}

// --- Helpers (Reused from Delivery logic) ---

const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr === 'N/A') return null;
    try {
        const normalized = dateStr.replace(/-/g, '.');
        const parts = normalized.split('.');
        if (parts.length !== 3) return null;
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } catch {
        return null;
    }
};

const parseDuration = (durationStr: string): number => {
    if (!durationStr) return 1;
    const match = durationStr.match(/(\d+)/);
    return match ? parseInt(match[0]) : 1;
};

const isDateInRange = (selectedDateStr: string, orderStartDate: string, orderDuration: string): boolean => {
    const selected = new Date(selectedDateStr);
    selected.setHours(0, 0, 0, 0);

    let start = parseDate(orderStartDate);
    if (!start && orderStartDate.includes('-')) {
        start = new Date(orderStartDate);
    }

    if (!start || isNaN(start.getTime())) return false;
    start.setHours(0, 0, 0, 0);

    const durationDays = parseDuration(orderDuration);
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);
    end.setHours(0, 0, 0, 0);

    return selected >= start && selected < end;
};

// --- Standard List Template ---
const STANDARD_LIST: Omit<ShoppingItem, 'id' | 'checked'>[] = [
    { name: "Piletina (File)", quantity: 15, unit: "kg", supplier: "Mesara Petrović" },
    { name: "Pirinač (Basmati)", quantity: 5, unit: "kg", supplier: "Metro" },
    { name: "Brokoli", quantity: 10, unit: "kg", supplier: "Kvantaš" },
    { name: "Maslinovo Ulje", quantity: 2, unit: "L", supplier: "Metro" },
    { name: "Bademi (Pečeni)", quantity: 500, unit: "g", supplier: "Zdrava Hrana" },
    { name: "Jaja (L)", quantity: 60, unit: "kom", supplier: "Pijaca" },
];

export default function ProcurementPage() {
    // Stat: Date Selection (Default to TOMORROW as procurement is usually forward-looking)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [selectedDate, setSelectedDate] = useState<string>(tomorrow.toISOString().split('T')[0]);

    // Data State
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);

    // Shopping List State
    const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
    const [newItemName, setNewItemName] = useState("");
    const [newItemQty, setNewItemQty] = useState("");
    const [newItemUnit, setNewItemUnit] = useState("kg");
    const [newItemSupplier, setNewItemSupplier] = useState("");

    // --- Effects ---

    useEffect(() => {
        async function fetchOrders() {
            try {
                const res = await fetch('/api/orders');
                const data = await res.json();
                if (Array.isArray(data)) setOrders(data);
            } catch (err) {
                console.error("Failed to fetch orders", err);
            } finally {
                setLoadingStats(false);
            }
        }
        fetchOrders();
    }, []);

    // --- Computed Stats ---

    const dailyStats = useMemo(() => {
        const activeOrders = orders.filter(o =>
            o.startDate && isDateInRange(selectedDate, o.startDate, o.duration)
        );

        const volumeByProduct: Record<string, number> = {};

        activeOrders.forEach(o => {
            // Normalize product names if needed. Assuming simple names for now.
            // Split by comma if multiple products? simpler for MVP: just take full string
            const prodName = o.product || "Unknown";
            volumeByProduct[prodName] = (volumeByProduct[prodName] || 0) + 1;
        });

        return {
            total: activeOrders.length,
            breakdown: volumeByProduct
        };
    }, [orders, selectedDate]);

    // --- Handlers ---

    const addItem = () => {
        if (!newItemName) return;
        const newItem: ShoppingItem = {
            id: Date.now().toString(),
            name: newItemName,
            quantity: parseFloat(newItemQty) || 1,
            unit: newItemUnit,
            supplier: newItemSupplier || "Ostalo",
            checked: false
        };
        setShoppingList([...shoppingList, newItem]);
        setNewItemName("");
        setNewItemQty("");
    };

    const toggleItem = (id: string) => {
        setShoppingList(list => list.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const deleteItem = (id: string) => {
        setShoppingList(list => list.filter(item => item.id !== id));
    };

    const loadStandardList = () => {
        if (shoppingList.length > 0) {
            if (!confirm("Ovo će dodati standardne artikle na postojeću listu. Nastaviti?")) return;
        }
        const newItems = STANDARD_LIST.map((tpl, idx) => ({
            ...tpl,
            id: `std-${Date.now()}-${idx}`,
            checked: false
        }));
        setShoppingList(prev => [...prev, ...newItems]);
    };

    const copyForWhatsapp = () => {
        const header = `🛒 *Nabavka za ${new Date(selectedDate).toLocaleDateString('sr-RS')}*\n------------------`;

        // Group by supplier for easier reading by drivers
        const bySupplier: Record<string, ShoppingItem[]> = {};
        shoppingList.forEach(item => {
            if (!bySupplier[item.supplier]) bySupplier[item.supplier] = [];
            bySupplier[item.supplier].push(item);
        });

        let body = "";
        Object.entries(bySupplier).forEach(([supplier, items]) => {
            body += `\n\n📍 *${supplier}*:`;
            items.forEach(item => {
                const check = item.checked ? "✅" : "⬜";
                body += `\n${check} ${item.name}: ${item.quantity}${item.unit}`;
            });
        });

        const footer = `\n\n------------------\n📊 Ukupno obroka: ${dailyStats.total}`;

        const fullText = header + body + footer;
        navigator.clipboard.writeText(fullText);
        alert("Lista kopirana! Zalepi u WhatsApp (Ctrl+V).");
    };

    return (
        <div className="hq-layout p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#121333] to-[#9cbe48]">
                        Nabavka i Kuhinja
                    </h1>
                    <p className="text-slate-500 mt-2">Planiranje namirnica na osnovu porudžbina</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-slate-500" />
                        <span className="text-xs text-slate-400 font-medium mr-2 uppercase tracking-wide">Za Datum:</span>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Left Col: Daily Stats */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Summary Card */}
                    <div className="bg-gradient-to-br from-[#121333] to-[#1a1b4b] rounded-[30px] p-8 text-white shadow-lg shadow-slate-200">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-slate-300 font-medium mb-1">Ukupno Obroka</p>
                                <h1 className="text-5xl font-bold text-[#9cbe48]">{loadingStats ? "..." : dailyStats.total}</h1>
                                <p className="text-slate-300 text-sm mt-2">
                                    Za {new Date(selectedDate).toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                <Utensils className="w-8 h-8 text-[#9cbe48]" />
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Card */}
                    <div className="bg-white rounded-[30px] p-8 shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Package className="w-5 h-5 text-[#9cbe48]" />
                            Struktura Obroka
                        </h3>

                        {loadingStats ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-8 bg-slate-50 rounded-lg w-full"></div>
                                <div className="h-8 bg-slate-50 rounded-lg w-3/4"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Object.entries(dailyStats.breakdown).length === 0 ? (
                                    <p className="text-slate-400 text-center py-4">Nema aktivnih paketa za ovaj dan.</p>
                                ) : (
                                    Object.entries(dailyStats.breakdown).map(([name, count]) => (
                                        <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]" title={name}>{name}</span>
                                            <span className="text-sm font-bold text-[#121333] bg-[#eef5da] px-2.5 py-1 rounded-lg">
                                                {count}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Col: Shopping List */}
                <div className="xl:col-span-2">
                    <div className="bg-white rounded-[30px] shadow-sm border border-slate-100 h-full flex flex-col">

                        {/* Toolbar */}
                        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <ShoppingCart className="w-6 h-6 text-[#9cbe48]" />
                                    Lista za Nabavku
                                    <span className="text-sm font-normal text-slate-400 ml-2">({shoppingList.length} stavki)</span>
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={loadStandardList}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    Učitaj Standard
                                </button>
                                <button
                                    onClick={copyForWhatsapp}
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#9cbe48] hover:bg-[#8bad3f] rounded-xl transition-colors shadow-lg shadow-emerald-100 flex items-center gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    Kopiraj za WhatsApp
                                </button>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-slate-50 border-b border-slate-100">
                            <div className="flex flex-col md:flex-row gap-4">
                                <input
                                    type="text"
                                    placeholder="Naziv namirnice (npr. Piletina)"
                                    className="flex-1 p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9cbe48]"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addItem()}
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Količina"
                                        className="w-24 p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9cbe48]"
                                        value={newItemQty}
                                        onChange={(e) => setNewItemQty(e.target.value)}
                                    />
                                    <select
                                        className="w-24 p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9cbe48] bg-white"
                                        value={newItemUnit}
                                        onChange={(e) => setNewItemUnit(e.target.value)}
                                    >
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                        <option value="l">l</option>
                                        <option value="kom">kom</option>
                                        <option value="pak">pak</option>
                                    </select>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Dobavljač / Mesto"
                                    className="w-full md:w-48 p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#9cbe48]"
                                    value={newItemSupplier}
                                    onChange={(e) => setNewItemSupplier(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addItem()}
                                />
                                <button
                                    onClick={addItem}
                                    className="px-6 py-3 bg-[#121333] text-white rounded-xl hover:bg-[#1a1b4b] transition-colors shadow-md shadow-slate-200 flex items-center justify-center"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto p-2">
                            {shoppingList.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                                    <ShoppingCart className="w-12 h-12 mb-4 text-slate-200" />
                                    <p>Lista je prazna.</p>
                                    <p className="text-sm">Dodajte namirnice iznad ili učitajte standardnu listu.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white sticky top-0 z-10">
                                        <tr>
                                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-12"></th>
                                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Namirnica</th>
                                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Količina</th>
                                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Dobavljač</th>
                                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {shoppingList.map((item) => (
                                            <tr key={item.id} className={cn("group hover:bg-slate-50 transition-colors", item.checked && "bg-slate-50/50")}>
                                                <td className="p-4">
                                                    <button onClick={() => toggleItem(item.id)} className="text-slate-400 hover:text-[#9cbe48] transition-colors">
                                                        {item.checked ? <CheckSquare className="w-5 h-5 text-[#9cbe48]" /> : <Square className="w-5 h-5" />}
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <span className={cn("font-medium text-slate-700", item.checked && "line-through text-slate-400")}>
                                                        {item.name}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={cn("text-sm font-semibold bg-slate-100 px-2 py-1 rounded-md text-slate-600", item.checked && "opacity-50")}>
                                                        {item.quantity} {item.unit}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={cn("text-sm text-slate-500", item.checked && "opacity-50")}>
                                                        {item.supplier}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => deleteItem(item.id)}
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
