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
            const { data: manualData, error: manualError } = await supabase
                .from('manual_clients')
                .select('*')
                .eq('id', decodedId)
                .single();

            if (manualData) {
                // Format CRM client
                return NextResponse.json({
                    id: manualData.id,
                    name: `${manualData.first_name} ${manualData.last_name}`,
                    email: manualData.email,
                    phone: manualData.phone,
                    address: manualData.address,
                    source: 'manual' as const,
                    created_at: manualData.created_at
                });
            }

            // If not in manual_clients, check cached_clients (Woo synced)
            const { data: cachedData, error: cachedError } = await supabase
                .from('cached_clients')
                .select('*')
                .eq('id', decodedId)
                .single();

            if (cachedData) {
                return NextResponse.json({
                    id: cachedData.id,
                    name: `${cachedData.first_name} ${cachedData.last_name}`,
                    email: cachedData.email, // cached_clients has email mapped
                    phone: cachedData.phone,
                    address: cachedData.address, // mapped from billing.address_1
                    city: cachedData.city,
                    source: 'woocommerce' as const, // Treat as Woo source for UI logic
                    wc_customer_id: cachedData.wc_customer_id,
                    order_count: cachedData.order_count
                });
            }

            if (manualError && cachedError) {
                console.error('Supabase error:', manualError || cachedError);
            }

            // If neither found, return 404 (or could fall through to search if ID looks like phone? No, UUID is specific)
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        } else {
            // Strategy: Search ORDERS first because:
            // 1. It supports searching by phone (Customers API 'search' does not reliably)
            // 2. It finds Guest users (who are not in Customers API)

            const ordersResponse = await api.get('orders', {
                search: decodedId,
                per_page: 100 // Fetch up to 100 to calculate guest order count if needed
            });

            // Helper to check if order matches our ID (phone or email)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const findMatchingOrder = (orders: any[]) => {
                return orders.find((o: any) => {
                    const normalizePhone = (phone: string) => phone?.replace(/[\s-]/g, '') || '';
                    const phoneMatch = normalizePhone(o.billing?.phone) === normalizePhone(decodedId);
                    const emailMatch = o.billing?.email?.toLowerCase() === decodedId.toLowerCase();
                    return phoneMatch || emailMatch;
                });
            };

            const matchingOrder = ordersResponse.data ? findMatchingOrder(ordersResponse.data) : null;

            if (matchingOrder) {
                // CASE 1: Client found in orders (Registered or Guest)

                if (matchingOrder.customer_id > 0) {
                    // Registered Customer - Fetch full profile for accurate data
                    try {
                        const customerResponse = await api.get(`customers/${matchingOrder.customer_id}`);
                        const customer = customerResponse.data;

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
                    } catch (e) {
                        console.error('Error fetching registered customer details:', e);
                        // Fallback to order details if customer fetch fails
                    }
                }

                // Guest User (or fallback)
                // Calculate order count from the search results
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const guestOrderCount = ordersResponse.data.filter((o: any) => {
                    const normalizePhone = (phone: string) => phone?.replace(/[\s-]/g, '') || '';
                    return normalizePhone(o.billing?.phone) === normalizePhone(decodedId) ||
                        o.billing?.email?.toLowerCase() === decodedId.toLowerCase();
                }).length;

                return NextResponse.json({
                    id: matchingOrder.billing.phone || matchingOrder.billing.email,
                    name: `${matchingOrder.billing.first_name} ${matchingOrder.billing.last_name}`,
                    email: matchingOrder.billing.email,
                    phone: matchingOrder.billing.phone,
                    address: `${matchingOrder.billing.address_1}, ${matchingOrder.billing.city}`,
                    source: 'woocommerce' as const,
                    order_count: guestOrderCount // Best effort count from search results
                });
            }

            // CASE 2: Not found in orders. 
            // If ID looks like an email, try searching Customers API directly
            // (Customers with no orders?, or search param works better for email)
            if (decodedId.includes('@')) {
                const customerResponse = await api.get('customers', {
                    email: decodedId // Exact match by email
                });

                if (customerResponse.data && customerResponse.data.length > 0) {
                    const customer = customerResponse.data[0];
                    return NextResponse.json({
                        id: customer.billing?.phone || customer.email,
                        name: `${customer.billing?.first_name} ${customer.billing?.last_name}`,
                        email: customer.email,
                        phone: customer.billing?.phone,
                        address: customer.billing?.address_1,
                        city: customer.billing?.city,
                        source: 'woocommerce' as const,
                        order_count: customer.orders_count || 0
                    });
                }
            }

            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
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
