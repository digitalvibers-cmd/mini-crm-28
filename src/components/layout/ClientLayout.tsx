"use client";

import { usePathname } from "next/navigation";

import { SidebarProvider, useSidebar } from "@/components/layout/SidebarContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

function LayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="flex">
            <Sidebar />
            <main
                className={cn(
                    "flex-1 p-10 min-h-screen transition-all duration-300 ease-in-out",
                    isCollapsed ? "ml-[80px]" : "ml-[250px]"
                )}
            >
                {children}
            </main>
        </div>
    );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    return (
        <SidebarProvider>
            {isLoginPage ? (
                children
            ) : (
                <LayoutContent>{children}</LayoutContent>
            )}
        </SidebarProvider>
    );
}
