"use client";

import { AlertTriangle, X } from "lucide-react";

interface DeleteOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    orderId: string;
    loading?: boolean;
}

export function DeleteOrderModal({
    isOpen,
    onClose,
    onConfirm,
    orderId,
    loading = false
}: DeleteOrderModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-[#121333]">Obriši Porudžbinu</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-slate-600">
                        Da li ste sigurni da želite da obrišete ovu porudžbinu?
                    </p>
                    <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-500">ID Porudžbine:</p>
                        <p className="font-mono font-bold text-[#121333]">{orderId}</p>
                    </div>
                    <p className="text-sm text-red-600 font-medium">
                        ⚠️ Ova akcija se ne može poništiti!
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Otkaži
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-lg shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Brisanje...' : 'Obriši'}
                    </button>
                </div>
            </div>
        </div>
    );
}
