"use client";

import { Plus, X, Calendar, CheckSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { addDays, format, parseISO } from "date-fns";
import { srLatn } from "date-fns/locale";

interface AddMenuToWeekModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    startDate: string;
    existingProgramIds: string[];
}

interface Program {
    id: string;
    name: string;
}

export function AddMenuToWeekModal({
    isOpen,
    onClose,
    onSuccess,
    startDate,
    existingProgramIds
}: AddMenuToWeekModalProps) {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingPrograms, setLoadingPrograms] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchPrograms();
        }
    }, [isOpen]);

    const fetchPrograms = async () => {
        setLoadingPrograms(true);
        try {
            const res = await fetch('/api/programs');
            if (res.ok) {
                const data = await res.json();
                // Filter out programs that already have menus
                const available = data.programs.filter(
                    (p: Program) => !existingProgramIds.includes(p.id)
                );
                setPrograms(available);
                if (available.length > 0) {
                    // Default select first available
                    setSelectedProgramId(available[0].id);
                } else {
                    setSelectedProgramId("");
                }
            }
        } catch (error) {
            console.error('Failed to fetch programs:', error);
        } finally {
            setLoadingPrograms(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedProgramId) return;

        setLoading(true);

        try {
            // Calculate end date (Sunday)
            const start = parseISO(startDate);
            const end = addDays(start, 6);
            const endDate = format(end, 'yyyy-MM-dd');

            // Auto-generate name
            const startLabel = format(start, 'd. MMM', { locale: srLatn });
            const endLabel = format(end, 'd. MMM', { locale: srLatn });
            const name = `Jelovnik ${startLabel} - ${endLabel}`;

            const res = await fetch('/api/weekly-menus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    program_id: selectedProgramId,
                    start_date: startDate,
                    end_date: endDate,
                    name: name
                })
            });

            const data = await res.json();

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                alert(data.error || 'Greška prilikom kreiranja jelovnika.');
            }
        } catch (error) {
            console.error('Create menu failed:', error);
            alert('Greška prilikom kreiranja jelovnika.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Plus className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-[#121333]">Dodaj Jelovnik</h2>
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
                        Dodajte jelovnik za postojeću nedelju ({format(parseISO(startDate), 'd. MMMM', { locale: srLatn })}).
                    </p>

                    {loadingPrograms ? (
                        <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            Učitavanje dostupnih programa...
                        </div>
                    ) : programs.length === 0 ? (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
                            <CheckSquare className="w-4 h-4" />
                            Svi programi već imaju jelovnike za ovu nedelju.
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Izaberite Program
                            </label>
                            <div className="space-y-2">
                                {programs.map((program) => (
                                    <div
                                        key={program.id}
                                        onClick={() => setSelectedProgramId(program.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedProgramId === program.id
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : 'border-slate-200 hover:border-emerald-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedProgramId === program.id
                                                ? 'border-emerald-500 bg-emerald-500'
                                                : 'border-slate-300'
                                            }`}>
                                            {selectedProgramId === program.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <span className={`font-medium ${selectedProgramId === program.id ? 'text-emerald-900' : 'text-slate-700'}`}>
                                            {program.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                    {programs.length > 0 && (
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !selectedProgramId}
                            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Kreiranje...
                                </>
                            ) : (
                                'Kreiraj Jelovnik'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
