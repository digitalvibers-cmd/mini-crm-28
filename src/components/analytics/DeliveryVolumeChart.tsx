"use client";

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Order {
    id: string;
    startDate: string; // "dd-mm-yyyy" or "yyyy-mm-dd"
    duration: string;  // "22 dana"
}

// Helper: Parse date from "dd.mm.yyyy" or "yyyy-mm-dd"
const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr === 'N/A') return null;
    try {
        const normalized = dateStr.replace(/-/g, '.');
        const parts = normalized.split('.');
        if (parts.length !== 3) return null;
        // dd.mm.yyyy -> new Date(yyyy, mm-1, dd)
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } catch {
        return null;
    }
};

const parseDuration = (durationStr: string): number => {
    if (!durationStr) return 1;
    const match = durationStr.match(/(\d+)/);
    return match ? parseInt(match[0]) : 1;
};

export default function DeliveryVolumeChart() {
    const [data, setData] = useState<{ date: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function calculateVolume() {
            try {
                const res = await fetch('/api/orders');
                const orders: Order[] = await res.json();

                const dateMap: Record<string, number> = {};

                orders.forEach(order => {
                    // Exact same parsing logic as DeliveryPage
                    let start = parseDate(order.startDate);
                    if (!start && order.startDate && order.startDate.includes('-')) {
                        start = new Date(order.startDate);
                    }

                    const duration = parseDuration(order.duration);

                    if (start && !isNaN(start.getTime())) {
                        start.setHours(0, 0, 0, 0); // Normalize to midnight local

                        for (let i = 0; i < duration; i++) {
                            const iterDate: Date = new Date(start);
                            iterDate.setDate(iterDate.getDate() + i);

                            // Use locale date string as key to avoid timezone issues
                            // "dd.mm.yyyy." or similar depending on locale, but consistent within this scope
                            const key = iterDate.toLocaleDateString('sr-RS');
                            dateMap[key] = (dateMap[key] || 0) + 1;
                        }
                    }
                });

                // Generate last 14 days chart data
                const chartData = [];
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                for (let i = 0; i < 14; i++) {
                    const forecastDate = new Date(today);
                    forecastDate.setDate(forecastDate.getDate() + i);

                    const key = forecastDate.toLocaleDateString('sr-RS');

                    chartData.push({
                        date: forecastDate.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' }), // "28.01"
                        timestamp: forecastDate.getTime(),
                        count: dateMap[key] || 0
                    });
                }

                setData(chartData);
            } catch (err) {
                console.error("Failed to calc volume", err);
            } finally {
                setLoading(false);
            }
        }

        calculateVolume();
    }, []);

    if (loading) return <div className="h-64 animate-pulse bg-slate-50 rounded-xl" />;

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar
                        dataKey="count"
                        fill="#9cbe48"
                        radius={[4, 4, 0, 0]}
                        barSize={32}
                        name="Broj Paketa"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
