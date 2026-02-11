import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const api = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL!,
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY!,
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET!,
    version: 'wc/v3'
});

export async function POST(request: Request) {
    // Initialize Supabase Admin client at runtime to avoid build-time errors
    // if the env var is missing during the build process.
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { searchParams } = new URL(request.url);
        const force = searchParams.get('force') === 'true';

        // 1. Fetch Orders from WooCommerce
        // We need to iterate to get a good chunk of history. 
        // For a full sync, we might need a background job, but for now 
        // let's fetch the last 1000 orders (10 pages of 100) or similar limit to avoid timeout.
        // Or just the last 100 for a quick test if force=false?
        // User has ~1000 clients, might have ~2000 orders.
        // Vercel timeout is 10-60s. We should limit this or use a cursor.

        let allOrders: any[] = [];
        let page = 1;
        const perPage = 100;
        const maxPages = 50; // Safety limit (5000 orders)

        // For this MVP sync, we'll try to fetch as many as possible within reason
        console.log("Starting sync...");

        while (page <= maxPages) {
            console.log(`Fetching page ${page}...`);
            const response = await api.get('orders', {
                page,
                per_page: perPage,
                status: 'any' // Get all orders to find all customers
            });

            const orders = response.data;
            if (orders.length === 0) break;

            allOrders = allOrders.concat(orders);
            page++;
        }

        console.log(`Fetched ${allOrders.length} orders.`);

        // 2. Extract Unique Clients
        const clientsMap = new Map<string, any>();

        allOrders.forEach(order => {
            const email = order.billing?.email;
            const phone = order.billing?.phone;

            // Key by email if present, else phone?
            // Ideally email is unique.
            if (!email) return;

            // If likely distinct person?
            const key = email.toLowerCase().trim();

            if (!clientsMap.has(key)) {
                clientsMap.set(key, {
                    email: key,
                    phone: phone || order.billing?.phone,
                    first_name: order.billing?.first_name || '',
                    last_name: order.billing?.last_name || '',
                    address: order.billing?.address_1 || '',
                    city: order.billing?.city || '',
                    wc_customer_id: order.customer_id === 0 ? null : order.customer_id,
                    source: order.customer_id === 0 ? 'woocommerce_guest' : 'woocommerce_registered',
                    order_count: 0,
                    last_order_date: null
                });
            }

            // Update stats
            const client = clientsMap.get(key);
            client.order_count++;

            // Check max date
            if (order.date_created) {
                if (!client.last_order_date || new Date(order.date_created) > new Date(client.last_order_date)) {
                    client.last_order_date = order.date_created;
                }
            }

            // Prefer non-empty fields if multiple orders have different info
            if (!client.phone && phone) client.phone = phone;
            if (!client.first_name && order.billing?.first_name) client.first_name = order.billing?.first_name;
        });

        const clientsToUpsert = Array.from(clientsMap.values());
        console.log(`Found ${clientsToUpsert.length} unique clients.`);

        // 3. Upsert to Supabase
        // Batch upsert?
        const { error } = await supabaseAdmin
            .from('cached_clients')
            .upsert(clientsToUpsert, {
                onConflict: 'email',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('Supabase Upsert Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${clientsToUpsert.length} clients from ${allOrders.length} orders.`,
            count: clientsToUpsert.length
        });

    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
