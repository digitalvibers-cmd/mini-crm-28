"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface EditOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    orderId: string;
}

interface OrderData {
    product_name: string;
    start_date: string;
    duration_days: number;
    address: string;
    customer_note?: string;
    payment_method: string;
    status: string;
}

export function EditOrderModal({ isOpen, onClose, onSuccess, orderId }: EditOrderModalProps) {
    const [orderData, setOrderData] = useState<OrderData>({
        product_name: "",
        start_date: "",
        duration_days: 7,
        address: "",
        customer_note: "",
        payment_method: "gotovina",
        status: "processing"
    });
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen && orderId) {
            fetchOrderData();
        }
    }, [isOpen, orderId]);

    const fetchOrderData = async () => {
        try {
            setFetchLoading(true);
            const res = await fetch(`/api/orders/manual/${orderId}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch order');
            }

            setOrderData({
                product_name: data.product_name,
                start_date: data.start_date,
                duration_days: data.duration_days,
                address: data.address,
                customer_note: data.customer_note || "",
                payment_method: data.payment_method || "gotovina",
                status: data.status || "processing"
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load order');
        } finally {
            setFetchLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`/api/orders/manual/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update order');
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 p-6 rounded-t-3xl flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-[#121333]">Izmeni Porudžbinu</h2>
                        <p className="text-sm text-slate-500 mt-1">Ažuriraj detalje porudžbine</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                {fetchLoading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-[#9cbe48] rounded-full animate-spin"></div>
                        <p className="mt-4 text-slate-500">Učitavanje podataka...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Naziv proizvoda *
                            </label>
                            <input
                                type="text"
                                required
                                value={orderData.product_name}
                                onChange={(e) => setOrderData({ ...orderData, product_name: e.target.value })}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Početak programa *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={orderData.start_date}
                                    onChange={(e) => setOrderData({ ...orderData, start_date: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Trajanje (dana) *
                                </label>
                                <select
                                    required
                                    value={orderData.duration_days}
                                    onChange={(e) => setOrderData({ ...orderData, duration_days: parseInt(e.target.value) })}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] bg-white"
                                >
                                    <option value={7}>7 dana</option>
                                    <option value={14}>14 dana</option>
                                    <option value={22}>22 dana</option>
                                    <option value={30}>30 dana</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Adresa dostave *
                            </label>
                            <input
                                type="text"
                                required
                                value={orderData.address}
                                onChange={(e) => setOrderData({ ...orderData, address: e.target.value })}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Način plaćanja
                                </label>
                                <select
                                    value={orderData.payment_method}
                                    onChange={(e) => setOrderData({ ...orderData, payment_method: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] bg-white"
                                >
                                    <option value="gotovina">Gotovina</option>
                                    <option value="kartica">Kartica</option>
                                    <option value="online">Online plaćanje</option>
                                    <option value="virman">Virman</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={orderData.status}
                                    onChange={(e) => setOrderData({ ...orderData, status: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] bg-white"
                                >
                                    <option value="processing">Processing</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Napomena (opciono)
                            </label>
                            <textarea
                                value={orderData.customer_note}
                                onChange={(e) => setOrderData({ ...orderData, customer_note: e.target.value })}
                                rows={3}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] resize-none"
                            />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                            >
                                Otkaži
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-[#9cbe48] text-white rounded-xl hover:bg-[#8bad3f] transition-colors font-medium shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Čuvanje...' : 'Sačuvaj Izmene'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
