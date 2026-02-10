"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OrdersChartProps {
    data?: { name: string; orders: number }[];
}

export function OrdersChart({ data }: OrdersChartProps) {
    // Fallback if no data provided
    const chartData = data || [
        { name: 'Mon', orders: 0 },
        { name: 'Tue', orders: 0 },
        { name: 'Wed', orders: 0 },
        { name: 'Thu', orders: 0 },
        { name: 'Fri', orders: 0 },
        { name: 'Sat', orders: 0 },
        { name: 'Sun', orders: 0 },
    ];

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F5" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9197B3', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9197B3', fontSize: 12 }}
                    />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar
                        dataKey="orders"
                        fill="#9cbe48"
                        radius={[10, 10, 0, 0]}
                        barSize={40}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

