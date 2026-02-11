"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Mail, Phone, MapPin, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CreateClientModal } from "../orders/CreateClientModal";

interface Client {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    source: 'woocommerce' | 'manual';
    supabase_id?: string;
    order_count?: number;
    last_order_date?: string | null;
}

interface ClientsTableProps {
    onClientCreated?: () => void;
}

export function ClientsTable({ onClientCreated }: ClientsTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 20, // Updated to 20 as requested
        totalPages: 1,
        totalCount: 0,
        hasMore: false
    });

    const fetchClients = async (page = 1) => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                page: page.toString(),
                per_page: '20', // Updated to 20
            });

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const res = await fetch(`/api/clients?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch clients');

            const data = await res.json();

            setClients(data.clients);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Failed to fetch clients:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchClients(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchClients(newPage);
        }
    };

    return (
        <div className="bg-white rounded-[30px] shadow-sm p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[#121333]">Svi Klijenti</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {loading ? 'Učitavanje...' : `${pagination.totalCount} ukupno`}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Traži klijente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#9cbe48] text-[#121333] placeholder:text-slate-400 w-64"
                        />
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#9cbe48] text-white rounded-xl hover:bg-[#8bad3f] transition-colors font-medium shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Novi Klijent
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="py-20 text-center text-slate-400">
                        <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-[#9cbe48] rounded-full animate-spin"></div>
                        <p className="mt-4">Učitavanje klijenata...</p>
                    </div>
                ) : clients.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                        <p>Nema pronađenih klijenata.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {clients.map((client) => (
                            <ClientRow key={client.id} client={client} />
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                    <div className="text-sm text-slate-500">
                        Strana {pagination.currentPage} od {pagination.totalPages}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            &lt;
                        </button>

                        {/* Simplified Pagination Logic */}
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let p = i + 1;
                            // Centered window logic
                            if (pagination.totalPages > 5) {
                                if (pagination.currentPage <= 3) p = i + 1;
                                else if (pagination.currentPage >= pagination.totalPages - 2) p = pagination.totalPages - 4 + i;
                                else p = pagination.currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={p}
                                    onClick={() => handlePageChange(p)}
                                    className={cn(
                                        "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all",
                                        pagination.currentPage === p
                                            ? "bg-[#9cbe48] text-white shadow-md shadow-emerald-100"
                                            : "border border-slate-200 hover:bg-slate-50 text-slate-500"
                                    )}
                                >
                                    {p}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            )}

            <CreateClientModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    fetchClients(pagination.currentPage);
                    setShowCreateModal(false);
                    onClientCreated?.();
                }}
            />
        </div>
    );
}

function ClientRow({ client }: { client: Client }) {
    // Simplified Row: No internal fetching, uses DB view data directly
    const detailUrl = `/clients/${encodeURIComponent(client.id)}`;

    return (
        <Link
            href={detailUrl}
            className="border border-slate-100 rounded-2xl p-5 hover:shadow-md hover:border-[#9cbe48]/30 transition-all block group"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-bold text-lg text-[#121333] group-hover:text-[#9cbe48] transition-colors">
                            {client.name}
                        </h3>
                        {client.source === 'manual' && (
                            <span className="px-2 py-0.5 bg-[#9cbe48]/10 text-[#9cbe48] text-xs font-bold rounded uppercase">
                                CRM
                            </span>
                        )}
                        {/* Identify guests/woo clients if needed, or keep clean */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span>{client.email || '-'}</span>
                        </div>

                        {client.phone && (
                            <div className="flex items-center gap-2 text-slate-600">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span>{client.phone}</span>
                            </div>
                        )}

                        {(client.address || client.city) && (
                            <div className="flex items-center gap-2 text-slate-600">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span>{client.address || ''} {client.city || ''}</span>
                            </div>
                        )}
                    </div>

                    {client.last_order_date && (
                        <div className="flex items-center gap-2 text-slate-600 text-sm mt-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>Poslednja porudžbina: {new Date(client.last_order_date).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        </div>
                    )}
                </div>

                <div className="text-right">
                    <div className="text-sm text-slate-500 mb-1">Porudžbine</div>
                    <div className="text-2xl font-bold text-[#121333]">
                        {client.order_count ?? 0}
                    </div>
                </div>
            </div>
        </Link>
    );
}
