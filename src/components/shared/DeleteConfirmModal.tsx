"use client";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    itemName?: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export default function DeleteConfirmModal({
    isOpen,
    title,
    message,
    itemName,
    onConfirm,
    onCancel,
    loading = false
}: DeleteConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-[#121333]">{title}</h2>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-slate-600">{message}</p>
                    {itemName && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <p className="text-red-700 font-medium text-center">"{itemName}"</p>
                        </div>
                    )}
                    <p className="text-sm text-slate-500">Ova akcija se ne može poništiti.</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 pb-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                        disabled={loading}
                    >
                        Otkaži
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-lg shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Brisanje...' : 'Obriši'}
                    </button>
                </div>
            </div>
        </div>
    );
}
