"use client";

interface Order {
    id: string;
    product: string;
    startDate: string;
    duration: string;
    status: string;
    payment_method: string;
    source: 'manual' | 'woocommerce';
    supabase_id?: string;
}

interface OrderHistoryTableProps {
    orders: Order[];
}

export function OrderHistoryTable({ orders }: OrderHistoryTableProps) {
    if (orders.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 text-center">
                <p className="text-slate-400 text-lg">Nema pronađenih porudžbina za ovog klijenta.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="bg-[#121333] text-white">
                        <th className="py-4 px-6 text-left font-bold">ID</th>
                        <th className="py-4 px-6 text-left font-bold">Proizvod</th>
                        <th className="py-4 px-6 text-left font-bold">Početak</th>
                        <th className="py-4 px-6 text-left font-bold">Trajanje</th>
                        <th className="py-4 px-6 text-left font-bold">Status</th>
                        <th className="py-4 px-6 text-left font-bold">Plaćanje</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order, index) => (
                        <tr
                            key={index}
                            className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-sm font-medium text-slate-900"
                        >
                            <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                    <span className={order.source === 'manual' ? 'text-[#9cbe48] font-bold' : ''}>
                                        {order.id}
                                    </span>
                                    {order.source === 'manual' && (
                                        <span className="inline-block px-2 py-0.5 bg-[#9cbe48]/10 text-[#9cbe48] text-[10px] font-bold rounded uppercase">
                                            CRM
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="py-4 px-6">{order.product}</td>
                            <td className="py-4 px-6">{order.startDate}</td>
                            <td className="py-4 px-6">{order.duration}</td>
                            <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'completed' || order.status === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                        : order.status === 'processing'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-slate-100 text-slate-700'
                                    }`}>
                                    {order.status}
                                </span>
                            </td>
                            <td className="py-4 px-6 lowercase">{order.payment_method}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
