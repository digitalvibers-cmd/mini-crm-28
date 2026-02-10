import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const api = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL!,
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY!,
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET!,
    version: 'wc/v3'
});

// Helper to check if ID is UUID (CRM client) or email (WooCommerce)
function isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

// GET single client
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const decodedId = decodeURIComponent(id);

        // Check if it's a CRM client (UUID) or WooCommerce client (email)
        if (isUUID(decodedId)) {
            // Fetch CRM client from Supabase
            const { data, error } = await supabase
                .from('manual_clients')
                .select('*')
                .eq('id', decodedId)
                .single();

            if (error) {
                console.error('Supabase error:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            if (!data) {
                return NextResponse.json({ error: 'Client not found' }, { status: 404 });
            }

            // Format CRM client
            return NextResponse.json({
                id: data.id,
                name: `${data.first_name} ${data.last_name}`,
                email: data.email,
                phone: data.phone,
                address: data.address,
                source: 'manual' as const,
                created_at: data.created_at
            });
        } else {
            // Fetch WooCommerce customer by email from orders
            const wcResponse = await api.get('orders', {
                search: decodedId, // Search by email
                per_page: 10 // Get multiple to ensure we find a match
            });

            if (!wcResponse.data || wcResponse.data.length === 0) {
                return NextResponse.json({ error: 'Client not found' }, { status: 404 });
            }

            // Find order with matching billing email
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const order = wcResponse.data.find((o: any) => o.billing.email.toLowerCase() === decodedId.toLowerCase());

            if (!order) {
                return NextResponse.json({ error: 'Client not found' }, { status: 404 });
            }

            return NextResponse.json({
                id: order.billing.email,
                name: `${order.billing.first_name} ${order.billing.last_name}`,
                email: order.billing.email,
                phone: order.billing.phone,
                address: `${order.billing.address_1}, ${order.billing.city}`,
                source: 'woocommerce' as const
            });
        }
    } catch (error) {
        console.error('Error fetching client:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT update CRM client
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const decodedId = decodeURIComponent(id);

        // Only allow updates for CRM clients (UUID)
        if (!isUUID(decodedId)) {
            return NextResponse.json(
                { error: 'Cannot update WooCommerce clients' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { first_name, last_name, email, phone, address } = body;

        // Validation
        if (!first_name || !last_name || !email) {
            return NextResponse.json(
                { error: 'First name, last name and email are required' },
                { status: 400 }
            );
        }

        // Update client
        const { data, error } = await supabase
            .from('manual_clients')
            .update({
                first_name,
                last_name,
                email,
                phone: phone || null,
                address: address || null
            })
            .eq('id', decodedId)
            .select()
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, client: data });
    } catch (error) {
        console.error('Error updating client:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE CRM client
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const decodedId = decodeURIComponent(id);

        // Only allow deletion for CRM clients (UUID)
        if (!isUUID(decodedId)) {
            return NextResponse.json(
                { error: 'Cannot delete WooCommerce clients' },
                { status: 400 }
            );
        }

        // Check for associated orders
        const { data: orders } = await supabase
            .from('manual_orders')
            .select('id')
            .eq('client_id', decodedId);

        if (orders && orders.length > 0) {
            return NextResponse.json(
                { error: `Cannot delete client with ${orders.length} associated orders. Delete orders first.` },
                { status: 400 }
            );
        }

        // Delete client
        const { error } = await supabase
            .from('manual_clients')
            .delete()
            .eq('id', decodedId);

        if (error) {
            console.error('Supabase delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
