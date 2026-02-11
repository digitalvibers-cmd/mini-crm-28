import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const api = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL!,
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY!,
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET!,
    version: 'wc/v3'
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    if (!phone && !email) {
        return NextResponse.json({ error: 'Phone or email required' }, { status: 400 });
    }

    try {
        // Search orders by phone OR email
        // We prioritize phone search if available as it's more specific for SMS/Call based workflows
        const searchTerm = phone || email || '';

        const wcResponse = await api.get('orders', {
            search: searchTerm,
            per_page: 100 // Look at last 100 orders matching the search term
        });

        const orders = wcResponse.data || [];

        // Filter robustly
        const matchingOrders = orders.filter((order: any) => {
            if (phone) {
                const normalizePhone = (p: string) => p?.replace(/[\s-]/g, '') || '';
                if (normalizePhone(order.billing?.phone) === normalizePhone(phone)) return true;
            }
            if (email) {
                if (order.billing?.email?.toLowerCase() === email.toLowerCase()) return true;
            }
            return false;
        });

        // Calculate stats
        const orderCount = matchingOrders.length;

        let lastOrderDate = null;
        if (matchingOrders.length > 0) {
            // Sort by date created desc
            // Note: WC API default sort is date desc, but let's be safe
            // Orders from search might not be sorted strictly if relying on relevance?
            // Usually they are date desc.
            // We can pick the first one's date_created
            // But let's sort to be sure
            matchingOrders.sort((a: any, b: any) =>
                new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
            );
            lastOrderDate = matchingOrders[0].date_created;
        }

        return NextResponse.json({
            order_count: orderCount,
            last_order_date: lastOrderDate
        });

    } catch (error) {
        console.error('Error fetching client counts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
