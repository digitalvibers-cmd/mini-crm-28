"use client";

import { Search } from "lucide-react";

export function Header({ title = "Hello Evano 👋," }: { title?: string }) {
    return (
        <header className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-medium font-heading text-slate-900">{title}</h1>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-[250px] pl-10 pr-3 py-2 border border-transparent rounded-xl leading-5 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 sm:text-sm transition-all shadow-sm"
                    placeholder="Search"
                />
            </div>
        </header>
    );
}
