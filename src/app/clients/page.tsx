"use client";

import { useState, useEffect } from "react";
import { ClientsTable } from "@/components/clients/ClientsTable";

export default function ClientsPage() {
    const [stats, setStats] = useState({
        totalClients: 0,
        manualClients: 0,
        wcClients: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch both sources to calculate stats
            const [wcRes, manualRes] = await Promise.all([
                fetch('/api/analytics'),
                fetch('/api/clients/manual')
            ]);

            const wcData = await wcRes.json();
            const manualData = await manualRes.json();

            setStats({
                totalClients: (wcData.totalCustomers || 0) + (manualData.length || 0),
                manualClients: manualData.length || 0,
                wcClients: wcData.totalCustomers || 0
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-[#121333] mb-2">Klijenti</h1>
                    <p className="text-slate-500">Upravljajte svim klijentima iz jednog mesta</p>
                </div>
                <button
                    onClick={async () => {
                        if (confirm('Ovo će osvežiti listu klijenata iz svih porudžbina. Može potrajati par minuta. Nastavi?')) {
                            setLoading(true);
                            try {
                                const res = await fetch('/api/clients/sync?force=true', { method: 'POST' });
                                const data = await res.json();
                                if (data.success) {
                                    alert(data.message);
                                    window.location.reload();
                                } else {
                                    alert('Greška: ' + data.error);
                                }
                            } catch (e) {
                                alert('Greška pri sinhronizaciji');
                            } finally {
                                setLoading(false);
                            }
                        }
                    }}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-white text-slate-600 rounded-xl hover:bg-slate-50 border border-slate-200 transition-colors disabled:opacity-50"
                >
                    <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{loading ? 'Sinhronizacija...' : 'Osveži listu'}</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Ukupno Klijenata</p>
                            <p className="text-3xl font-bold text-[#121333]">
                                {loading ? '...' : stats.totalClients}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-[#121333]/5 rounded-2xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-[#121333]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 mb-1">CRM Klijenti</p>
                            <p className="text-3xl font-bold text-[#9cbe48]">
                                {loading ? '...' : stats.manualClients}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-[#9cbe48]/10 rounded-2xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-[#9cbe48]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 mb-1">WooCommerce</p>
                            <p className="text-3xl font-bold text-slate-600">
                                {loading ? '...' : stats.wcClients}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Clients Table */}
            <ClientsTable onClientCreated={fetchStats} />
        </div>
    );
}
