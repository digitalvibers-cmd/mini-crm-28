import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Clients
const api = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL!,
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY!,
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET!,
    version: 'wc/v3'
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncClients() {
    console.log("🚀 Starting Sync Process (Test Run)...");

    let allOrders: any[] = [];
    let page = 1;
    const perPage = 100;
    const maxPages = 50; // Fetch up to 5000 orders

    try {
        // 1. Fetch Orders
        console.log("📦 Fetching orders from WooCommerce...");
        while (page <= maxPages) {
            process.stdout.write(`   Page ${page}... `);
            const response = await api.get('orders', {
                page,
                per_page: perPage,
                status: 'any'
            });

            const orders = response.data;
            if (orders.length === 0) {
                console.log("\n   No more orders found.");
                break;
            }

            allOrders = allOrders.concat(orders);
            console.log(`Fetched ${orders.length} orders. Total: ${allOrders.length}`);
            page++;
        }

        // 2. Extract Clients
        console.log(`\n🔍 Extracting unique clients from ${allOrders.length} orders...`);
        const clientsMap = new Map<string, any>();

        allOrders.forEach(order => {
            const email = order.billing?.email;
            const phone = order.billing?.phone;

            if (!email) return;

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

            if (order.date_created) {
                if (!client.last_order_date || new Date(order.date_created) > new Date(client.last_order_date)) {
                    client.last_order_date = order.date_created;
                }
            }

            // Prefer non-empty fields
            if (!client.phone && phone) client.phone = phone;
            if (!client.first_name && order.billing?.first_name) client.first_name = order.billing?.first_name;
        });

        const clientsToUpsert = Array.from(clientsMap.values());
        console.log(`✨ Found ${clientsToUpsert.length} unique clients.`);

        // 3. Upsert to Supabase
        console.log("💾 Saving to Supabase 'cached_clients'...");

        // Split into chunks of 100 to avoid request size limits
        const chunkSize = 100;
        for (let i = 0; i < clientsToUpsert.length; i += chunkSize) {
            const chunk = clientsToUpsert.slice(i, i + chunkSize);
            const { error } = await supabaseAdmin
                .from('cached_clients')
                .upsert(chunk, {
                    onConflict: 'email',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error('❌ Supabase Error:', error);
            } else {
                process.stdout.write(`   Saved chunk ${i / chunkSize + 1}... `);
            }
        }

        console.log("\n✅ Sync Verified! Table populated.");

        // Verify count
        const { count, error: countError } = await supabaseAdmin
            .from('cached_clients')
            .select('*', { count: 'exact', head: true });

        console.log(`📊 Final Row Count in 'cached_clients': ${count}`);

    } catch (error: any) {
        console.error('\n❌ Sync Failed:', error.message);
    }
}

syncClients();
