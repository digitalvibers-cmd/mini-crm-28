"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, ArrowRight, Loader2, Info } from "lucide-react";
import CreateWeeklyMenuModal from "@/components/weekly-menus/CreateWeeklyMenuModal";
import Link from "next/link";
import { WeeklyMenu } from "@/types/weekly-menu";
import { format, parseISO } from "date-fns";
import { srLatn } from "date-fns/locale";

interface WeeklyMenuGroup {
    start_date: string;
    end_date: string;
    name: string;
    menus: WeeklyMenu[];
}

export default function WeeklyMenusPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [weeklyMenuGroups, setWeeklyMenuGroups] = useState<WeeklyMenuGroup[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWeeklyMenus = async () => {
        try {
            const res = await fetch('/api/weekly-menus', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                const allMenus: WeeklyMenu[] = data.menus || [];

                // Group by start_date
                const groupsMap = new Map<string, WeeklyMenuGroup>();

                allMenus.forEach(menu => {
                    const key = menu.start_date;
                    if (!groupsMap.has(key)) {
                        groupsMap.set(key, {
                            start_date: menu.start_date,
                            end_date: menu.end_date,
                            name: menu.name, // Assumption: Menus created in bulk share same name logic
                            menus: []
                        });
                    }
                    groupsMap.get(key)?.menus.push(menu);
                });

                const groups = Array.from(groupsMap.values());

                // Sort by date DESCENDING (Newest/Future first -> Oldest/Past last)
                groups.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

                setWeeklyMenuGroups(groups);
            }
        } catch (error) {
            console.error('Failed to fetch menus', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeeklyMenus();
    }, []);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-[#121333] mb-2 tracking-tight">Nedeljni Jelovnici</h1>
                    <p className="text-slate-500">Planirajte i organizujte obroke po nedeljama.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="group flex items-center gap-3 bg-[#121333] text-white px-6 py-3.5 rounded-2xl hover:bg-[#2a2b55] transition-all shadow-lg shadow-slate-200 active:scale-95"
                >
                    <div className="bg-white/10 p-1 rounded-lg group-hover:bg-white/20 transition-colors">
                        <Plus className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">Novi Jelovnik</span>
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[#9cbe48]" />
                </div>
            ) : weeklyMenuGroups.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Calendar className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#121333] mb-1">Nema kreiranih jelovnika</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Kreirajte prvi nedeljni plan za vaše klijente.</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="text-[#9cbe48] font-semibold hover:text-[#8bad3f] transition-colors"
                    >
                        + Kreiraj novi
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {weeklyMenuGroups.map((group) => {
                        const startDate = parseISO(group.start_date);
                        const endDate = parseISO(group.end_date);
                        const isCurrentWeek = new Date() >= startDate && new Date() <= endDate;

                        return (
                            <Link
                                key={group.start_date}
                                href={`/weekly-menus/week/${group.start_date}`}
                                className="block group"
                            >
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-[#9cbe48] hover:shadow-lg hover:shadow-[#9cbe48]/10 transition-all relative overflow-hidden">
                                    {isCurrentWeek && (
                                        <div className="absolute top-0 right-0 bg-[#9cbe48] text-white text-xs font-bold px-3 py-1 rounded-bl-xl z-10">
                                            TEKUĆA NEDELJA
                                        </div>
                                    )}

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-0">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border shrink-0 ${isCurrentWeek
                                                ? 'bg-[#9cbe48]/10 border-[#9cbe48] text-[#9cbe48]'
                                                : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-[#9cbe48]/5 group-hover:text-[#9cbe48] group-hover:border-[#9cbe48]/30'
                                                } transition-colors`}>
                                                <span className="text-xs font-bold uppercase">{format(startDate, 'MMM', { locale: srLatn })}</span>
                                                <span className="text-xl font-bold">{format(startDate, 'd')}</span>
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-bold text-[#121333] group-hover:text-[#9cbe48] transition-colors mb-2">
                                                    {group.name}
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {group.menus.map(menu => (
                                                        <span
                                                            key={menu.id}
                                                            className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-medium text-slate-600 flex items-center gap-1.5"
                                                        >
                                                            <div className={`w-1.5 h-1.5 rounded-full ${menu.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                                                            {menu.program?.name}
                                                        </span>
                                                    ))}
                                                    <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-medium text-slate-400">
                                                        {group.menus.length} programa
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 md:pr-8">
                                            <div className="text-right hidden md:block">
                                                <div className="text-sm text-slate-400 mb-1">Period</div>
                                                <div className="font-semibold text-slate-700">
                                                    {format(startDate, 'd. MMM', { locale: srLatn })} - {format(endDate, 'd. MMM yyyy.', { locale: srLatn })}
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#9cbe48] group-hover:text-white transition-all ml-auto md:ml-0">
                                                <ArrowRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            <CreateWeeklyMenuModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    fetchWeeklyMenus();
                }}
            />
        </div>
    );
}
