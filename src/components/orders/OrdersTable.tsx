"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, Plus, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateOrderModal } from "./CreateOrderModal";
import { EditOrderModal } from "./EditOrderModal";
import { DeleteOrderModal } from "./DeleteOrderModal";

interface Order {
    id: string;
    customer: string;
    email: string;
    address: string;
    phone: string;
    product: string;
    payment_method: string;
    startDate: string;
    duration: string;
    note: string;
    source?: 'woocommerce' | 'manual';
    supabase_id?: string;
}

export function OrdersTable() {
    const [searchTerm, setSearchTerm] = useState("");
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
    const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8; // Fits nicely in 600px height

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders');
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setOrders(data);
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleDelete = async () => {
        if (!deletingOrderId) return;

        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/orders/manual/${deletingOrderId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete order');
            }

            // Refresh orders
            await fetchOrders();
            setDeletingOrderId(null);
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete order');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const filteredOrders = orders.filter(order =>
        order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
    const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

    return (
        <div className="bg-white rounded-[30px] shadow-sm p-8 min-h-[600px] flex flex-col justify-between" onClick={() => setActiveNoteId(null)}>
            <div>
                {/* Table Header Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-[#121333]">Sve Porudžbine</h2>
                        <p className="text-sm text-[#9cbe48] font-medium">Aktivni Članovi</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#121333]" />
                            <input
                                type="text"
                                placeholder="Traži..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#9cbe48] text-[#121333] placeholder:text-slate-400"
                            />
                        </div>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#9cbe48] text-white rounded-xl hover:bg-[#8bad3f] transition-colors font-medium shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nova Porudžbina
                        </button>

                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium text-[#121333] cursor-pointer hover:bg-[#eef5da] transition-colors">
                            <span>Sortiraj po : <span className="font-bold">Najnovije</span></span>
                            <ChevronDown className="w-4 h-4 text-[#9cbe48]" />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="w-full relative">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-[#121333] text-white text-sm font-medium">
                                <th className="py-4 pl-4 rounded-l-2xl w-[80px]">ID</th>
                                <th className="py-4 w-[150px]">Kupac</th>
                                <th className="py-4 w-[200px]">Proizvod</th>
                                <th className="py-4 w-[100px]">Početak</th>
                                <th className="py-4 w-[100px]">Trajanje</th>
                                <th className="px-2 py-4 text-left text-xs font-bold text-white w-[12%]">Adresa</th>
                                <th className="px-2 py-4 text-center text-xs font-bold text-white w-[10%]">Plaćanje</th>
                                <th className="px-2 py-4 text-center text-xs font-bold text-white w-[8%] rounded-r-2xl">Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-10 text-center text-slate-400">Učitavanje porudžbina...</td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-slate-400">Nema pronađenih porudžbina.</td>
                                </tr>
                            ) : (
                                paginatedOrders.map((order) => (
                                    <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-sm font-medium text-slate-900 align-top relative">
                                        <td className={cn(
                                            "py-5 pl-2",
                                            order.source === 'manual' ? "text-[#9cbe48] font-bold" : "text-slate-500"
                                        )}>
                                            {order.id}
                                            {order.source === 'manual' && (
                                                <span className="ml-2 inline-block px-2 py-0.5 bg-[#9cbe48]/10 text-[#9cbe48] text-[10px] font-bold rounded uppercase">
                                                    CRM
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-5 break-words pr-2">{order.customer}</td>
                                        <td className="py-5 break-words pr-2">{order.product || "N/A"}</td>
                                        <td className="py-5 text-slate-500 break-words pr-2">{order.startDate}</td>
                                        <td className="py-5 text-slate-500 break-words pr-2">{order.duration}</td>
                                        <td className="py-5 text-slate-500 break-words pr-2 relative">
                                            {order.address}
                                            {order.note && (
                                                <div className="inline-block align-top ml-1 relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveNoteId(activeNoteId === order.id ? null : order.id);
                                                        }}
                                                        className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors cursor-pointer shadow-sm animate-pulse"
                                                        title="Prikaži napomenu"
                                                    />
                                                    {activeNoteId === order.id && (
                                                        <div
                                                            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white border border-slate-200 rounded-xl shadow-xl text-xs font-normal text-slate-600 leading-relaxed text-left"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div className="font-semibold text-slate-900 mb-1 border-b border-slate-100 pb-1">Napomena:</div>
                                                            {order.note}
                                                            {/* decorative arrow */}
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-5 text-center">
                                            <span className="px-4 py-1 rounded-md border text-xs font-semibold bg-slate-100/50 text-slate-600 border-slate-200 inline-block break-words max-w-full">
                                                {order.payment_method}
                                            </span>
                                        </td>
                                        <td className="py-5 text-center">
                                            {order.source === 'manual' && order.supabase_id && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setEditingOrderId(order.supabase_id!)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Izmeni"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingOrderId(order.supabase_id!)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Obriši"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer / Pagination */}
            {!loading && filteredOrders.length > 0 && (
                <div className="flex justify-between items-center mt-8 text-sm text-slate-400 font-medium pt-4 border-t border-slate-50">
                    <p>
                        Prikazano {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} od {filteredOrders.length} rezultata
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrev}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            &lt;
                        </button>

                        {/* Simple Page Indicator */}
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // Logic to show window of pages could be complex, for now simple first 5 or sliding window
                                // But easy "1 of N" is user requested pagination.
                                // Let's just show current page as active button
                                let p = i + 1;
                                if (totalPages > 5 && currentPage > 3) {
                                    p = currentPage - 2 + i;
                                }
                                if (p > totalPages) return null;

                                return (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className={cn(
                                            "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all",
                                            currentPage === p
                                                ? "bg-[#9cbe48] text-white shadow-md shadow-emerald-100"
                                                : "border border-slate-200 hover:bg-slate-50 text-slate-500"
                                        )}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            )}

            <CreateOrderModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    fetchOrders();
                    setShowCreateModal(false);
                }}
            />

            {editingOrderId && (
                <EditOrderModal
                    isOpen={!!editingOrderId}
                    onClose={() => setEditingOrderId(null)}
                    onSuccess={() => {
                        fetchOrders();
                        setEditingOrderId(null);
                    }}
                    orderId={editingOrderId}
                />
            )}

            <DeleteOrderModal
                isOpen={!!deletingOrderId}
                onClose={() => setDeletingOrderId(null)}
                onConfirm={handleDelete}
                orderId={deletingOrderId || ''}
                loading={deleteLoading}
            />
        </div>
    );
}
