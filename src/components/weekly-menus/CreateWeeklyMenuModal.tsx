"use client";

import { useState, useEffect } from "react";
import { X, Calendar, CheckSquare, Square } from "lucide-react";
import { Program } from "@/types/weekly-menu";
import { parseISO, startOfISOWeek, endOfISOWeek, format } from "date-fns";
import { srLatn } from "date-fns/locale";

interface CreateWeeklyMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateWeeklyMenuModal({ isOpen, onClose, onSuccess }: CreateWeeklyMenuModalProps) {
    const [name, setName] = useState("");
    const [selectedProgramIds, setSelectedProgramIds] = useState<Set<string>>(new Set());
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchPrograms();
            setName("");
            setSelectedProgramIds(new Set());
            setStartDate("");
            setEndDate("");
            setError(null);
        }
    }, [isOpen]);

    const fetchPrograms = async () => {
        try {
            const res = await fetch('/api/programs');
            if (res.ok) {
                const data = await res.json();
                setPrograms(data.programs || []);
                // By default select all? No, let user choose.
            }
        } catch (err) {
            console.error('Failed to fetch programs', err);
        }
    };

    const toggleProgram = (id: string) => {
        const newSet = new Set(selectedProgramIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedProgramIds(newSet);
    };

    const toggleAllPrograms = () => {
        if (selectedProgramIds.size === programs.length) {
            setSelectedProgramIds(new Set());
        } else {
            setSelectedProgramIds(new Set(programs.map(p => p.id)));
        }
    };

    const handleWeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value; // "2024-W20"
        if (!val) return;

        try {
            // parseISO handles "YYYY-Www" format, but adding "-1" ensures we target Monday
            const dateInWeek = parseISO(`${val}-1`);
            const start = startOfISOWeek(dateInWeek);
            const end = endOfISOWeek(dateInWeek);

            const startStr = format(start, 'yyyy-MM-dd');
            const endStr = format(end, 'yyyy-MM-dd');

            setStartDate(startStr);
            setEndDate(endStr);

            // Auto-generate name
            if (!name || name.startsWith('Jelovnik')) {
                const startLabel = format(start, 'd. MMM', { locale: srLatn });
                const endLabel = format(end, 'd. MMM', { locale: srLatn });
                setName(`Jelovnik ${startLabel} - ${endLabel}`);
            }

        } catch (err) {
            console.error("Error parsing date", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!startDate || !endDate) {
            setError("Molimo izaberite nedelju");
            return;
        }

        if (selectedProgramIds.size === 0) {
            setError("Molimo izaberite bar jedan program");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/weekly-menus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    program_ids: Array.from(selectedProgramIds),
                    start_date: startDate,
                    end_date: endDate
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create menu');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const allSelected = programs.length > 0 && selectedProgramIds.size === programs.length;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl scale-100 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                    <h2 className="text-xl font-bold text-[#121333]">Novi Nedeljni Jelovnik</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">

                    {/* Week Selection - Moved to top for better flow */}
                    <div>
                        <label className="block text-sm font-semibold text-[#121333] mb-2">
                            Nedelja *
                        </label>
                        <div className="relative">
                            <input
                                type="week"
                                onChange={handleWeekChange}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] focus:border-transparent transition-all"
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                        {startDate && endDate && (
                            <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#9cbe48]" />
                                <span className="text-sm text-emerald-800 font-medium">
                                    {format(parseISO(startDate), 'd. MMMM yyyy.', { locale: srLatn })} - {format(parseISO(endDate), 'd. MMMM yyyy.', { locale: srLatn })}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-[#121333] mb-2">
                            Naziv Jelovnika *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="npr. Jul - Nedelja 1"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbe48] focus:border-transparent transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {/* Program Selection Checkboxes */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-[#121333]">
                                Programi Ishrane *
                            </label>
                            <button
                                type="button"
                                onClick={toggleAllPrograms}
                                className="text-xs font-medium text-[#9cbe48] hover:text-[#8bad3f] transition-colors"
                            >
                                {allSelected ? "Otkaži sve" : "Izaberi sve"}
                            </button>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 max-h-48 overflow-y-auto space-y-1">
                            {programs.map(prog => {
                                const isSelected = selectedProgramIds.has(prog.id);
                                return (
                                    <div
                                        key={prog.id}
                                        onClick={() => toggleProgram(prog.id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-white shadow-sm border border-emerald-100' : 'hover:bg-slate-100 border border-transparent'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-[#9cbe48] border-[#9cbe48] text-white' : 'bg-white border-slate-300 text-transparent'
                                            }`}>
                                            <CheckSquare className="w-3.5 h-3.5" />
                                        </div>
                                        <span className={`text-sm font-medium ${isSelected ? 'text-[#121333]' : 'text-slate-600'}`}>
                                            {prog.name}
                                        </span>
                                    </div>
                                );
                            })}
                            {programs.length === 0 && (
                                <div className="p-4 text-center text-sm text-slate-400">
                                    Nema dostupnih programa.
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-2 ml-1">
                            Izabrano: {selectedProgramIds.size} od {programs.length}
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
                        >
                            Odustani
                        </button>
                        <button
                            type="submit"
                            disabled={loading || selectedProgramIds.size === 0}
                            className="px-6 py-2.5 bg-[#9cbe48] text-white rounded-xl hover:bg-[#8bad3f] transition-all font-medium shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Kreiraj {selectedProgramIds.size > 1 ? `(${selectedProgramIds.size})` : ''}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
