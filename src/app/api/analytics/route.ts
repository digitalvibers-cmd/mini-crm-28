import { NextResponse } from 'next/server';
import { wooCommerceApi } from '@/lib/woocommerce';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // Fetch Total Customers from DB View (Unified Manual + Cached Woo)
        const { count: totalCustomers, error: dbError } = await supabase
            .from('all_clients_view')
            .select('*', { count: 'exact', head: true });

        if (dbError) {
            console.error("Supabase Error counting clients:", dbError);
        }

        // Fetch Total Orders (Members/Active proxy)
        const ordersResponse = await wooCommerceApi.get("orders", { per_page: 1 });
        const totalOrders = ordersResponse.headers['x-wp-total'] || 0;

        // Fetch Active Orders (Processing)
        const activeOrdersResponse = await wooCommerceApi.get("orders", { status: 'processing', per_page: 1 });
        const activeOrders = activeOrdersResponse.headers['x-wp-total'] || 0;

        // Fetch Sales Report for Chart (Last 7 days)
        // Note: 'reports/sales' endpoint might require Legacy API enabled or specific permissions. 
        // Fallback: We can simulate trend from recent orders if reports are unavailable.
        // For now, let's try fetching orders from last 7 days and aggregate them.

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const dateString = sevenDaysAgo.toISOString();

        const recentOrdersResponse = await wooCommerceApi.get("orders", {
            after: dateString,
            per_page: 100
        });

        const recentOrders = recentOrdersResponse.data;

        // Group orders by date
        const dailyOrders: Record<string, number> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recentOrders.forEach((order: any) => {
            const date = order.date_created.split('T')[0]; // YYYY-MM-DD
            dailyOrders[date] = (dailyOrders[date] || 0) + 1;
        });

        // Format for Chart (Last 7 days)
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateKey = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue...

            chartData.push({
                name: dayName,
                orders: dailyOrders[dateKey] || 0
            });
        }

        return NextResponse.json({
            totalCustomers: totalCustomers || 0,
            totalOrders: parseInt(totalOrders as string),
            activeNow: parseInt(activeOrders as string),
            chartData
        });

    } catch (error) {
        console.error("WooCommerce API Error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
