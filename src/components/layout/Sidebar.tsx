"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShoppingBag, ShoppingCart, ChevronRight, ChevronLeft, ChevronDown, Truck, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";
import { useState } from "react";

const menuItems = [
    { icon: LayoutDashboard, label: "Analitika", href: "/" },
    { icon: ShoppingBag, label: "Porudžbine", href: "/orders" },
    { icon: Users, label: "Klijenti", href: "/clients" },
    {
        icon: UtensilsCrossed,
        label: "Jela",
        href: "/meals",
        submenu: [
            { label: "Sastojci", href: "/ingredients" },
            { label: "Jela", href: "/meals" },
            { label: "Jelovnici", href: "/weekly-menus" },
        ]
    },
    { icon: ShoppingCart, label: "Nabavka", href: "/procurement" },
    { icon: Truck, label: "Dostava", href: "/delivery" },
];

export function Sidebar() {
    const pathname = usePathname();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const [expandedMenus, setExpandedMenus] = useState<string[]>(["Jela"]); // Jela expanded by default

    const toggleSubmenu = (label: string) => {
        setExpandedMenus(prev =>
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    };

    return (
        <aside
            className={cn(
                "bg-[var(--bg-sidebar)] h-screen flex flex-col fixed left-0 top-0 shadow-sm z-50 font-heading transition-all duration-300 ease-in-out border-r border-slate-100",
                isCollapsed ? "w-[80px]" : "w-[250px]"
            )}
        >
            <div className={cn("flex flex-col items-center gap-2", isCollapsed ? "p-4 justify-center" : "p-8")}>
                <div className="relative w-full flex items-center justify-center">
                    {/* Logo Image */}
                    <img
                        src="/logo_28.png"
                        alt="28 Ishrana"
                        className={cn("transition-all duration-300", isCollapsed ? "w-10 h-10" : "w-16 h-16")}
                    />
                </div>
                {!isCollapsed && (
                    <div className="text-center">
                        <span className="text-2xl font-bold tracking-tight whitespace-nowrap text-[#121333]">28 Ishrana</span>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest opacity-60">Powered by Digital Vibe</p>
                    </div>
                )}
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    const hasSubmenu = item.submenu && item.submenu.length > 0;
                    const isExpanded = expandedMenus.includes(item.label);
                    const isSubmenuActive = hasSubmenu && item.submenu?.some(sub => pathname === sub.href);

                    return (
                        <div key={item.label}>
                            {/* Main Menu Item */}
                            {hasSubmenu && !isCollapsed ? (
                                <button
                                    onClick={() => toggleSubmenu(item.label)}
                                    className={cn(
                                        "w-full flex items-center rounded-lg transition-colors duration-200 group relative p-3",
                                        isSubmenuActive || isActive
                                            ? "bg-[#9cbe48] text-white shadow-md shadow-emerald-100"
                                            : "text-[#9197b3] hover:bg-[#121333] hover:text-white"
                                    )}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <item.icon className={cn("w-6 h-6 flex-shrink-0", (isActive || isSubmenuActive) ? "text-white" : "text-current")} />
                                        <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                                    </div>
                                    <ChevronDown
                                        className={cn(
                                            "w-4 h-4 transition-transform",
                                            isExpanded ? "rotate-180" : ""
                                        )}
                                    />
                                </button>
                            ) : (
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center rounded-lg transition-colors duration-200 group relative",
                                        isCollapsed ? "justify-center p-3" : "justify-between p-3",
                                        isActive
                                            ? "bg-[#9cbe48] text-white shadow-md shadow-emerald-100"
                                            : "text-[#9197b3] hover:bg-[#121333] hover:text-white"
                                    )}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={cn("w-6 h-6 flex-shrink-0", isActive ? "text-white" : "text-current")} />
                                        {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
                                    </div>
                                </Link>
                            )}

                            {/* Submenu Items */}
                            {hasSubmenu && !isCollapsed && isExpanded && (
                                <div className="ml-6 mt-1 space-y-1 border-l-2 border-slate-200 pl-4">
                                    {item.submenu!.map((subItem) => {
                                        const isSubActive = pathname === subItem.href;
                                        return (
                                            <Link
                                                key={subItem.href}
                                                href={subItem.href}
                                                className={cn(
                                                    "block py-2 px-3 rounded-lg text-sm transition-colors",
                                                    isSubActive
                                                        ? "bg-emerald-50 text-[#9cbe48] font-semibold"
                                                        : "text-slate-600 hover:bg-slate-100 hover:text-[#121333]"
                                                )}
                                            >
                                                {subItem.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100">
                {!isCollapsed && (
                    <div className="mb-4 flex items-center gap-3 overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop"
                            alt="User"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-[#9cbe48] ring-offset-2"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#121333] truncate">Evano</p>
                            <p className="text-xs text-slate-400 truncate">Manager</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                )}

                <button
                    onClick={toggleSidebar}
                    className="w-full h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    {isCollapsed ? <ChevronRight /> : <div className="flex items-center gap-2"><ChevronLeft /><span className="text-sm">Collapse</span></div>}
                </button>
            </div>
        </aside>
    );
}
