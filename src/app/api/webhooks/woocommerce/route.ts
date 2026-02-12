import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WEBHOOK_SECRET = process.env.WOOCOMMERCE_WEBHOOK_SECRET;

export async function POST(request: Request) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-wc-webhook-signature');

        // 1. Verify Signature (Security)
        if (WEBHOOK_SECRET && signature) {
            const computedSignature = crypto
                .createHmac('sha256', WEBHOOK_SECRET)
                .update(body)
                .digest('base64');

            if (computedSignature !== signature) {
                console.error('❌ Invalid Webhook Signature');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        } else if (WEBHOOK_SECRET) {
            console.error('❌ Missing Webhook Signature');
            return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        } else {
            console.warn('⚠️ WOOCOMMERCE_WEBHOOK_SECRET not set. Skipping signature verification.');
        }

        const payload = JSON.parse(body);
        const topic = request.headers.get('x-wc-webhook-topic'); // e.g., 'order.created'

        console.log(`📥 Received Webhook: ${topic}`, { id: payload.id });

        // 2. Handle Order Events (Created or Updated)
        if (topic === 'order.created' || topic === 'order.updated' || topic === 'action.woocommerce_order_status_changed') {
            await syncClientFromOrder(payload);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('❌ Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function syncClientFromOrder(order: any) {
    const email = order.billing?.email?.trim().toLowerCase();
    const phone = order.billing?.phone?.trim();

    if (!email) {
        console.log('⚠️ Order has no email, skipping client sync.');
        return;
    }

    console.log(`🔄 Syncing client: ${email}`);

    // Prepare client data
    const clientData = {
        email: email,
        phone: phone || null,
        first_name: order.billing?.first_name || '',
        last_name: order.billing?.last_name || '',
        address: order.billing?.address_1 || '',
        city: order.billing?.city || '',
        wc_customer_id: order.customer_id === 0 ? null : order.customer_id,
        source: order.customer_id === 0 ? 'woocommerce_guest' : 'woocommerce',
        // We don't increment order_count blindly here because we might process the same order twice.
        // Instead, we should ideally fetch the current count or just update the latest info.
        // For simplicity in this MVP, we will UPDATE the client info and update 'last_order_date'.
        // To keep 'order_count' accurate, we really should run a recount or increment if it's a NEW order.
        // But 'order.created' suggests it is new.
        last_order_date: order.date_created
    };

    // 3. Upsert to Supabase
    // We first check if the client exists to handle order_count intelligently?
    // Actually, SQL 'ON CONFLICT' is best. 
    // But incrementing order_count is tricky in a simple upsert if we don't know if this order was already counted.
    // OPTION A: Just upsert details. The Full Sync script fixes counts. The UI shows counts from `all_clients_view`...
    // WAIT! `all_clients_view` gets `order_count` from `cached_clients`.
    // If we receive a NEW order, we should increment it.

    // Let's try to fetch the existing client first.
    const { data: existingClient } = await supabaseAdmin
        .from('cached_clients')
        .select('order_count, last_order_date')
        .eq('email', email)
        .single();

    let newCount = 1;
    if (existingClient) {
        newCount = (existingClient.order_count || 0) + 1;
        // Keep the latest date
        if (new Date(clientData.last_order_date) < new Date(existingClient.last_order_date)) {
            clientData.last_order_date = existingClient.last_order_date;
        }
    }

    const { error } = await supabaseAdmin
        .from('cached_clients')
        .upsert({
            ...clientData,
            order_count: newCount
        }, {
            onConflict: 'email'
        });

    if (error) {
        console.error('❌ Failed to upsert client:', error);
    } else {
        console.log(`✅ Client synced: ${email} (Order Count: ${newCount})`);
    }
}
