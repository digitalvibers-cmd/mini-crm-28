"use client";

import { useState } from "react";

interface ClientDetailCardProps {
    client: {
        id: string;
        name: string;
        email: string;
        phone: string;
        address: string;
        source: 'manual' | 'woocommerce';
        created_at?: string;
    };
    onEdit?: () => void;
    onDelete?: () => void;
}

export function ClientDetailCard({ client, onEdit, onDelete }: ClientDetailCardProps) {
    const isCRM = client.source === 'manual';

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold text-[#121333]">{client.name}</h2>
                        {isCRM && (
                            <span className="inline-block px-3 py-1 bg-[#9cbe48]/10 text-[#9cbe48] text-xs font-bold rounded-full uppercase">
                                CRM
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500">
                        {isCRM ? 'Ručno kreiran klijent' : 'WooCommerce klijent'}
                    </p>
                </div>

                {/* Action Buttons (CRM only) */}
                {isCRM && (
                    <div className="flex gap-2">
                        <button
                            onClick={onEdit}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Izmeni klijenta"
                        >
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Obriši klijenta"
                        >
                            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <p className="text-sm text-slate-500 mb-1">Email</p>
                    <p className="text-lg font-medium text-[#121333]">{client.email}</p>
                </div>

                <div>
                    <p className="text-sm text-slate-500 mb-1">Telefon</p>
                    <p className="text-lg font-medium text-[#121333]">{client.phone || 'N/A'}</p>
                </div>

                <div className="md:col-span-2">
                    <p className="text-sm text-slate-500 mb-1">Adresa</p>
                    <p className="text-lg font-medium text-[#121333]">{client.address || 'N/A'}</p>
                </div>

                {isCRM && client.created_at && (
                    <div className="md:col-span-2">
                        <p className="text-sm text-slate-500 mb-1">Kreiran</p>
                        <p className="text-lg font-medium text-[#121333]">
                            {new Date(client.created_at).toLocaleDateString('sr-RS')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
