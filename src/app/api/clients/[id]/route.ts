import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const api = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL!,
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY!,
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET!,
    version: 'wc/v3'
});

// Helper to check if ID is UUID (CRM client) or phone number (WooCommerce)
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

        // Check if it's a CRM client (UUID) or WooCommerce client (phone)
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
            // Fetch WooCommerce customer by phone/email using Customers API
            const wcResponse = await api.get('customers', {
                search: decodedId,
                per_page: 10
            });

            if (!wcResponse.data || wcResponse.data.length === 0) {
                return NextResponse.json({ error: 'Client not found' }, { status: 404 });
            }

            // Find customer with matching phone OR email
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const customer = wcResponse.data.find((c: any) => {
                // Normalize phone numbers for comparison (remove spaces, dashes, etc.)
                const normalizePhone = (phone: string) => phone?.replace(/[\s-]/g, '') || '';
                const phoneMatch = normalizePhone(c.billing?.phone) === normalizePhone(decodedId);
                const emailMatch = c.email?.toLowerCase() === decodedId.toLowerCase();
                return phoneMatch || emailMatch;
            });

            if (!customer) {
                return NextResponse.json({ error: 'Client not found' }, { status: 404 });
            }

            return NextResponse.json({
                id: customer.billing?.phone || customer.email,
                name: `${customer.billing?.first_name || customer.first_name || ''} ${customer.billing?.last_name || customer.last_name || ''}`.trim() || customer.email,
                email: customer.email,
                phone: customer.billing?.phone,
                address: customer.billing?.address_1,
                city: customer.billing?.city,
                source: 'woocommerce' as const,
                order_count: customer.orders_count || 0
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
