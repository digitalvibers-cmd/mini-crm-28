"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ClientDetailCard } from "@/components/clients/ClientDetailCard";
import { OrderHistoryTable } from "@/components/clients/OrderHistoryTable";
import { EditClientModal } from "@/components/clients/EditClientModal";

export default function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.id as string;

    const [client, setClient] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, [clientId]);

    const fetchData = async () => {
        setLoading(true);
        setLoadingOrders(true);
        try {
            // Fetch client first
            const res = await fetch(`/api/clients/${encodeURIComponent(clientId)}`);
            if (!res.ok) {
                throw new Error('Client not found');
            }
            const data = await res.json();
            setClient(data);
            setLoading(false); // Client loaded, show UI

            // Fetch orders
            const ordersRes = await fetch(`/api/clients/${encodeURIComponent(clientId)}/orders`);
            if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                setOrders(ordersData);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Klijent nije pronađen');
            setLoading(false);
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Da li ste sigurni da želite da obrišete klijenta ${client.name}?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/clients/${encodeURIComponent(clientId)}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Greška prilikom brisanja klijenta');
                return;
            }

            alert('Klijent uspešno obrisan');
            router.push('/clients');
        } catch (err) {
            console.error('Failed to delete client:', err);
            alert('Greška prilikom brisanja klijenta');
        }
    };

    const handleEdit = () => {
        setShowEditModal(true);
    };

    const handleEditSuccess = () => {
        fetchData(); // Refresh data after edit
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-400">Učitavanje...</div>
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className="space-y-4">
                <Link
                    href="/clients"
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-[#9cbe48] transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Nazad na listu klijenata
                </Link>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                    <p className="text-red-600 font-medium">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Breadcrumb */}
            <Link
                href="/clients"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-[#9cbe48] transition-colors"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Nazad na listu klijenata
            </Link>

            {/* Client Detail Card */}
            <ClientDetailCard
                client={client}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Order History */}
            <div>
                <h3 className="text-2xl font-bold text-[#121333] mb-4">
                    Istorija Porudžbina {loadingOrders ? '' : `(${orders.length})`}
                </h3>

                {loadingOrders ? (
                    <div className="bg-white rounded-[30px] shadow-sm p-12 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-[#9cbe48] rounded-full animate-spin"></div>
                        <p className="mt-4 text-slate-400">Učitavanje porudžbina...</p>
                    </div>
                ) : (
                    <OrderHistoryTable orders={orders} />
                )}
            </div>

            {/* Edit Modal */}
            {client && (
                <EditClientModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    client={client}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
}
