import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize WooCommerce
const wooUrl = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || "https://28ishrana.rs";
const wooKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
const wooSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

if (!wooUrl || !wooKey || !wooSecret) {
    console.error('Error: Missing WooCommerce environment variables.');
    process.exit(1);
}

// @ts-ignore
const WooApi = WooCommerceRestApi.default || WooCommerceRestApi;

const api = new WooApi({
    url: wooUrl,
    consumerKey: wooKey,
    consumerSecret: wooSecret,
    version: "wc/v3",
});

async function runSync() {
    console.log('🚀 Starting Full Client Sync...');

    let page = 1;
    let totalSynced = 0;
    const perPage = 50; // Use smaller chunks to be safe
    let hasMore = true;

    // Map to store unique clients by email (and phone as secondary check)
    // We prioritize Email as the unique identifier for syncing
    const clientsMap = new Map<string, any>();

    try {
        // 1. Fetch ALL Orders
        while (hasMore) {
            console.log(`📥 Fetching orders page ${page}...`);

            try {
                const response = await api.get("orders", {
                    page: page,
                    per_page: perPage,
                    status: 'any' // process all orders to catch all customers
                });

                const orders = response.data;
                const totalPages = parseInt(response.headers['x-wp-totalpages'] as string);

                if (orders.length === 0 || page > totalPages) {
                    hasMore = false;
                    break;
                }

                orders.forEach((order: any) => {
                    // Extract customer info
                    // Priority: Billing Email > Billing Phone
                    const email = order.billing?.email?.trim().toLowerCase();
                    const phone = order.billing?.phone?.trim();

                    if (!email) return; // Skip if no email

                    // Use email as key
                    const key = email;

                    if (!clientsMap.has(key)) {
                        clientsMap.set(key, {
                            email: email,
                            phone: phone || null,
                            first_name: order.billing?.first_name || '',
                            last_name: order.billing?.last_name || '',
                            address: order.billing?.address_1 || '',
                            city: order.billing?.city || '',
                            wc_customer_id: order.customer_id === 0 ? null : order.customer_id, // 0 means guest
                            source: order.customer_id === 0 ? 'woocommerce_guest' : 'woocommerce' as const,
                            order_count: 0,
                            last_order_date: null
                        });
                    }

                    const client = clientsMap.get(key);
                    client.order_count++;

                    // Update last order date
                    if (order.date_created) {
                        if (!client.last_order_date || new Date(order.date_created) > new Date(client.last_order_date)) {
                            client.last_order_date = order.date_created;
                        }
                    }

                    // Enrich missing data from newer/other orders if available
                    if (!client.phone && phone) client.phone = phone;
                    if (!client.address && order.billing?.address_1) client.address = order.billing.address_1;
                    if (!client.city && order.billing?.city) client.city = order.billing.city;
                    if (!client.first_name && order.billing?.first_name) client.first_name = order.billing.first_name;
                    if (!client.last_name && order.billing?.last_name) client.last_name = order.billing.last_name;
                });

                if (page >= totalPages) {
                    hasMore = false;
                } else {
                    page++;
                    // Small delay to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

            } catch (err: any) {
                console.error(`❌ Error fetching page ${page}:`, err.message);
                // Try to continue or break?
                // For now break to avoid infinite loops on auth errors
                break;
            }
        }

        const uniqueClients = Array.from(clientsMap.values());
        console.log(`✅ Extracted ${uniqueClients.length} unique clients from orders.`);

        // 2. Batch Upsert to Supabase
        console.log('💾 Upserting to Supabase...');

        const CHUNK_SIZE = 100;
        for (let i = 0; i < uniqueClients.length; i += CHUNK_SIZE) {
            const chunk = uniqueClients.slice(i, i + CHUNK_SIZE);

            const { error } = await supabase
                .from('cached_clients')
                .upsert(chunk, {
                    onConflict: 'email',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error(`❌ Error upserting chunk ${i}-${i + CHUNK_SIZE}:`, error.message);
            } else {
                console.log(`   Synced chunk ${i / CHUNK_SIZE + 1}/${Math.ceil(uniqueClients.length / CHUNK_SIZE)}`);
                totalSynced += chunk.length;
            }
        }

        console.log(`🎉 Sync Complete! Total clients synced: ${totalSynced}`);

    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

runSync();
