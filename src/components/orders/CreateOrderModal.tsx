"use client";

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { CreateClientModal } from "./CreateClientModal";

interface CreateOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Client {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

export function CreateOrderModal({ isOpen, onClose, onSuccess }: CreateOrderModalProps) {
    const [step, setStep] = useState<'client' | 'order'>('client');
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState("");
    const [showCreateClient, setShowCreateClient] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [orderData, setOrderData] = useState({
        product_name: "",
        start_date: "",
        duration_days: "7",
        address: "",
        customer_note: "",
        payment_method: "gotovina"
    });

    // Fetch manual clients
    useEffect(() => {
        if (isOpen) {
            fetchClients();
        }
    }, [isOpen]);

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/clients/manual');
            const data = await res.json();
            setClients(data);
        } catch (err) {
            console.error('Failed to fetch clients:', err);
        }
    };

    const handleClientSuccess = (newClient: Client) => {
        setClients([newClient, ...clients]);
        setSelectedClientId(newClient.id);
        setShowCreateClient(false);
    };

    const handleSubmitOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch('/api/orders/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: selectedClientId,
                    ...orderData,
                    duration_days: parseInt(orderData.duration_days)
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create order');
            }

            onSuccess();
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep('client');
        setSelectedClientId("");
        setOrderData({
            product_name: "",
            start_date: "",
            duration_days: "7",
            address: "",
            customer_note: "",
            payment_method: "gotovina"
        });
        setError("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-slate-100 p-6 rounded-t-3xl flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-[#121333]">Nova Porudžbina</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Korak {step === 'client' ? '1/2' : '2/2'}: {step === 'client' ? 'Izbor klijenta' : 'Detalji porudžbine'}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Step 1: Client Selection */}
                    {step === 'client' && (
                        <div className="p-6 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Izaberi klijenta *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateClient(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#9cbe48] border border-[#9cbe48] rounded-lg hover:bg-[#f4f9e8] transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Novi Klijent
                                    </button>
                                </div>

                                {clients.length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50 rounded-xl">
                                        <p className="text-slate-500 mb-4">Nema kreiranih klijenata.</p>
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateClient(true)}
                                            className="px-4 py-2 bg-[#121333] text-white rounded-xl hover:bg-[#1a1b4b] transition-colors"
                                        >
                                            Kreiraj prvog klijenta
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {clients.map((client) => (
                                            <div
                                                key={client.id}
                                                onClick={() => setSelectedClientId(client.id)}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedClientId === client.id
                                                        ? 'border-[#9cbe48] bg-[#f4f9e8]'
                                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900">
                                                            {client.first_name} {client.last_name}
                                                        </h4>
                                                        <p className="text-sm text-slate-500 mt-1">{client.email}</p>
                                                    </div>
                                                    {selectedClientId === client.id && (
                                                        <div className="w-5 h-5 bg-[#9cbe48] rounded-full flex items-center justify-center">
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                    type="button"
                                    onClick={() => setStep('order')}
                                    disabled={!selectedClientId}
                                    className="flex-1 px-6 py-3 bg-[#121333] text-white rounded-xl hover:bg-[#1a1b4b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Nastavi na Detalje
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Order Details */}
                    {step === 'order' && (
                        <form onSubmit={handleSubmitOrder} className="p-6 space-y-6">
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
                                    placeholder="npr. Mršavljenje 22 dana"
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
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Trajanje (dana) *
                                    </label>
                                    <select
                                        required
                                        value={orderData.duration_days}
                                        onChange={(e) => setOrderData({ ...orderData, duration_days: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] bg-white"
                                    >
                                        <option value="7">7 dana</option>
                                        <option value="14">14 dana</option>
                                        <option value="22">22 dana</option>
                                        <option value="30">30 dana</option>
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
                                    placeholder="Kralja Petra 25, Beograd"
                                />
                            </div>

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
                                    Napomena (opciono)
                                </label>
                                <textarea
                                    value={orderData.customer_note}
                                    onChange={(e) => setOrderData({ ...orderData, customer_note: e.target.value })}
                                    rows={3}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] resize-none"
                                    placeholder="Dodatne napomene za dostavu..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setStep('client')}
                                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                                >
                                    Nazad
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 bg-[#9cbe48] text-white rounded-xl hover:bg-[#8bad3f] transition-colors font-medium shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Kreiranje...' : 'Kreiraj Porudžbinu'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <CreateClientModal
                isOpen={showCreateClient}
                onClose={() => setShowCreateClient(false)}
                onSuccess={handleClientSuccess}
            />
        </>
    );
}
