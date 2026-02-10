"use client";

import { use, useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { srLatn } from "date-fns/locale";
import { ArrowLeft, ChevronDown, ChevronRight, Loader2, Calendar, Copy, ClipboardPaste, Trash2, Check } from "lucide-react";
import Link from "next/link";
import WeeklyMenuGrid from "@/components/weekly-menus/WeeklyMenuGrid";
import { WeeklyMenu, WeeklyMenuItem } from "@/types/weekly-menu";
import { MealCategory, Meal } from "@/types/meals";
import { DeleteWeeklyMenuModal } from "@/components/weekly-menus/DeleteWeeklyMenuModal";
import { AddMenuToWeekModal } from "@/components/weekly-menus/AddMenuToWeekModal";

interface PageProps {
    params: Promise<{ startDate: string }>;
}

export default function WeekDetailsPage({ params }: PageProps) {
    const { startDate } = use(params);
    const [menus, setMenus] = useState<WeeklyMenu[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<MealCategory[]>([]);
    const [expandedMenuIds, setExpandedMenuIds] = useState<Set<string>>(new Set());

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{
        type: 'menu' | 'week';
        id?: string;
        name?: string;
    } | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Add menu modal state
    const [addMenuModalOpen, setAddMenuModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
        fetchCategories();
    }, [startDate]);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/weekly-menus?start_date=${startDate}`);
            if (res.ok) {
                const data = await res.json();
                setMenus(data.menus || []);
                if (data.menus?.length > 0) {
                    setExpandedMenuIds(new Set([data.menus[0].id]));
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/meal-categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data.categories || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleMenu = (id: string) => {
        const newSet = new Set(expandedMenuIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedMenuIds(newSet);
    };

    const handleCopyMenu = async (targetMenuId: string, sourceMenuId: string) => {
        if (!sourceMenuId || !targetMenuId) return;

        // Set a flag in sessionStorage to track which menu was copied to
        sessionStorage.setItem('lastCopiedMenuId', targetMenuId);

        try {
            const res = await fetch('/api/weekly-menus/copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_menu_id: sourceMenuId,
                    target_menu_id: targetMenuId
                }),
                cache: 'no-store'
            });

            const data = await res.json();

            if (res.ok) {
                // Force navigation with cache busting
                window.location.href = window.location.pathname + '?refresh=' + Date.now();
            } else {
                alert(data.error || "Greška prilikom kopiranja.");
            }
        } catch (error) {
            console.error("Copy failed", error);
            alert("Greška prilikom kopiranja.");
        }
    };

    // Modal handlers
    const openDeleteModal = (type: 'menu' | 'week', id?: string, name?: string) => {
        setDeleteTarget({ type, id, name });
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        setDeleting(false);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        setDeleting(true);

        try {
            if (deleteTarget.type === 'menu' && deleteTarget.id) {
                // Delete individual menu
                const res = await fetch(`/api/weekly-menus/${deleteTarget.id}`, {
                    method: 'DELETE'
                });

                const data = await res.json();

                if (res.ok) {
                    window.location.href = '/weekly-menus';
                } else {
                    alert(data.error || "Greška prilikom brisanja.");
                    setDeleting(false);
                }
            } else if (deleteTarget.type === 'week') {
                // Delete entire week
                const res = await fetch('/api/weekly-menus/delete-week', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ start_date: startDate })
                });

                const data = await res.json();

                if (res.ok) {
                    window.location.href = '/weekly-menus';
                } else {
                    alert(data.error || "Greška prilikom brisanja.");
                    setDeleting(false);
                }
            }
        } catch (error) {
            console.error("Delete failed", error);
            alert("Greška prilikom brisanja.");
            setDeleting(false);
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#9cbe48]" />
            </div>
        );
    }

    const parsedDate = parseISO(startDate);
    const dateLabel = format(parsedDate, 'd. MMMM yyyy.', { locale: srLatn });

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm sticky top-4 z-20">
                <div className="flex items-center gap-4">
                    <Link
                        href="/weekly-menus"
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-[#121333] flex items-center gap-3">
                            Nedeljni Pregled
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {dateLabel}
                            </span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Upravljanje jelovnicima za {menus.length} programa
                        </p>
                    </div>
                </div>

                {/* Delete Week Button */}
                <button
                    onClick={() => openDeleteModal('week', undefined, dateLabel)}
                    className="px-4 py-2 flex items-center gap-2 text-red-600 hover:text-white hover:bg-red-600 bg-red-50 border border-red-200 rounded-xl transition-all font-medium"
                    title="Obriši celu nedelju"
                >
                    <Trash2 className="w-4 h-4" />
                    Obriši Nedelju
                </button>
            </div>

            <div className="space-y-4">
                {menus.map(menu => (
                    <WeeklyMenuCollapsible
                        key={menu.id}
                        menu={menu}
                        allMenus={menus}
                        categories={categories}
                        isExpanded={expandedMenuIds.has(menu.id)}
                        onToggle={() => toggleMenu(menu.id)}
                        onCopyFrom={(sourceId) => handleCopyMenu(menu.id, sourceId)}
                        onDelete={() => openDeleteModal('menu', menu.id, menu.program?.name || 'jelovnik')}
                    />
                ))}
            </div>

            {/* Add Menu Button */}
            <button
                onClick={() => setAddMenuModalOpen(true)}
                className="w-full mt-6 p-4 rounded-3xl border-2 border-dashed border-[#9cbe48]/30 hover:border-[#9cbe48] text-[#9cbe48] bg-[#9cbe48]/5 hover:bg-[#9cbe48]/10 transition-all font-bold flex items-center justify-center gap-2 group"
            >
                Dodaj jelovnik +
            </button>

            {/* Delete Confirmation Modal */}
            <DeleteWeeklyMenuModal
                isOpen={deleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                type={deleteTarget?.type || 'menu'}
                menuName={deleteTarget?.name}
                weekLabel={deleteTarget?.name}
                loading={deleting}
            />

            {/* Add Menu Modal */}
            <AddMenuToWeekModal
                isOpen={addMenuModalOpen}
                onClose={() => setAddMenuModalOpen(false)}
                onSuccess={() => {
                    fetchData();
                    setAddMenuModalOpen(false);
                }}
                startDate={startDate}
                existingProgramIds={menus.map(m => m.program_id)}
            />

        </div>
    );
}

// Sub-component for individual menu handling
function WeeklyMenuCollapsible({
    menu,
    allMenus,
    categories,
    isExpanded,
    onToggle,
    onCopyFrom,
    onDelete
}: {
    menu: WeeklyMenu,
    allMenus: WeeklyMenu[],
    categories: MealCategory[],
    isExpanded: boolean,
    onToggle: () => void,
    onCopyFrom: (sourceId: string) => void,
    onDelete: () => void
}) {
    const [items, setItems] = useState<WeeklyMenuItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedMenuId, setCopiedMenuId] = useState<string | null>(null);

    // Check clipboard state on mount and when storage changes
    useEffect(() => {
        const checkClipboard = () => {
            const copied = sessionStorage.getItem('copiedMenuId');
            setCopiedMenuId(copied);
        };

        checkClipboard();
        window.addEventListener('storage', checkClipboard);
        return () => window.removeEventListener('storage', checkClipboard);
    }, []);

    useEffect(() => {
        if (isExpanded && !fetched && !loading) {
            fetchItems();
        }
    }, [isExpanded]);

    const fetchItems = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/weekly-menus/${menu.id}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setItems(data.menu.items || []);
                setFetched(true);
            } else {
                throw new Error('Failed to fetch menu items');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Greška pri učitavanju');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (day: number, categoryId: string, meal: Meal) => {
        try {
            const res = await fetch(`/api/weekly-menus/${menu.id}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    day_of_week: day,
                    meal_category_id: categoryId,
                    meal_id: meal.id
                })
            });

            if (res.ok) {
                const { item } = await res.json();
                setItems(prev => [...prev, item]); // Add to local state
            }
        } catch (err) {
            console.error('Failed to add item', err);
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        const previousItems = [...items];
        setItems(prev => prev.filter(i => i.id !== itemId));

        try {
            const res = await fetch(`/api/weekly-menus/${menu.id}/items?id=${itemId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                setItems(previousItems);
                throw new Error('Failed to delete');
            }
        } catch (err) {
            console.error('Failed to remove item', err);
            setItems(previousItems);
        }
    };


    return (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md relative">
            <div
                className="w-full flex items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
            >
                <div
                    className="flex items-center gap-4 flex-1"
                    onClick={onToggle}
                >
                    <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-[#9cbe48] text-white rotate-90' : 'bg-slate-100 text-slate-400 rotate-0'}`}>
                        <ChevronRight className="w-5 h-5 transition-transform duration-300" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-[#121333]">{menu.program?.name}</h3>
                        <p className="text-xs font-medium uppercase tracking-wider mt-0.5">
                            {error ? (
                                <span className="text-red-500">Greška</span>
                            ) : fetched ? (
                                <span className="text-slate-500">{items.length} obroka</span>
                            ) : (
                                <span className="text-slate-400">Učitavanje...</span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Copy button - always visible */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            sessionStorage.setItem('copiedMenuId', menu.id);
                            sessionStorage.setItem('copiedMenuName', menu.program?.name || 'Jelovnik');
                            setCopiedMenuId(menu.id);
                            // Trigger custom event for other components
                            window.dispatchEvent(new Event('storage'));
                        }}
                        className="p-2 text-slate-400 hover:text-[#9cbe48] hover:bg-emerald-50 rounded-lg transition-all"
                        title="Kopiraj jelovnik"
                        type="button"
                    >
                        <Copy className="w-4 h-4" />
                    </button>

                    {/* Paste button - visible only when something is copied */}
                    {copiedMenuId && copiedMenuId !== menu.id && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCopyFrom(copiedMenuId);
                            }}
                            className="p-2 text-[#9cbe48] hover:text-white hover:bg-[#9cbe48] bg-emerald-50 rounded-lg transition-all"
                            title="Zalepi ovde"
                            type="button"
                        >
                            <ClipboardPaste className="w-4 h-4" />
                        </button>
                    )}

                    {/* Delete button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Obriši jelovnik"
                        type="button"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>

                    <Link
                        href={`/weekly-menus/${menu.id}/shopping-list`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-slate-400 hover:text-[#9cbe48] hover:bg-emerald-50 rounded-lg transition-all"
                        title="Lista za kupovinu"
                    >
                        <Calendar className="w-5 h-5" />
                    </Link>
                </div>
            </div>


            {/* No modal needed anymore - using Copy/Paste buttons */}



            {isExpanded && (
                <div className="border-t border-slate-100 p-1 animate-in slide-in-from-top-2 duration-200">
                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-[#9cbe48]" />
                        </div>
                    ) : error ? (
                        <div className="py-8 text-center">
                            <p className="text-red-500 text-sm mb-2">{error}</p>
                            <button
                                onClick={fetchItems}
                                className="px-4 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Pokušaj ponovo
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">

                            <WeeklyMenuGrid
                                menu={menu}
                                items={items}
                                categories={categories}
                                onAddItem={handleAddItem}
                                onRemoveItem={handleRemoveItem}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
