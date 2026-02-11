import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { wooCommerceApi } from '@/lib/woocommerce';

interface Client {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    source: 'woocommerce' | 'manual';
    supabase_id?: string;
    order_count?: number;
    last_order_date?: string | null;
}

// GET all clients with pagination
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const perPage = parseInt(searchParams.get('per_page') || '50');
        const searchQuery = searchParams.get('search') || '';

        // Fetch WooCommerce customers with pagination
        let wcCustomers: any[] = [];
        let wcTotalCount = 0;

        try {
            const wcResponse = await wooCommerceApi.get('customers', {
                page,
                per_page: perPage,
                search: searchQuery
            });

            wcCustomers = wcResponse.data;
            // WooCommerce returns total count in headers
            wcTotalCount = parseInt(wcResponse.headers['x-wp-total'] || '0');
        } catch (wcError) {
            console.error('WooCommerce API error:', wcError);
        }

        // Fetch manual clients from Supabase
        let manualClientsQuery = supabase
            .from('manual_clients')
            .select('*', { count: 'exact' });

        // Apply search filter if provided
        if (searchQuery) {
            manualClientsQuery = manualClientsQuery.or(
                `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
            );
        }

        const { data: manualClients, error, count: manualTotalCount } = await manualClientsQuery;

        if (error) {
            console.error('Supabase error:', error);
        }

        // Transform WooCommerce customers
        const wcClientsMap = new Map<string, Client>();
        wcCustomers.forEach((customer: any) => {
            // Use phone if available, otherwise use email as identifier
            const identifier = customer.billing?.phone || customer.email;
            if (!identifier) return; // Skip if neither phone nor email exists

            if (!wcClientsMap.has(identifier)) {
                wcClientsMap.set(identifier, {
                    id: identifier,
                    name: `${customer.billing?.first_name || customer.first_name || ''} ${customer.billing?.last_name || customer.last_name || ''}`.trim() || customer.email,
                    email: customer.email,
                    phone: customer.billing?.phone,
                    address: customer.billing?.address_1,
                    city: customer.billing?.city,
                    source: 'woocommerce' as const,
                    order_count: customer.orders_count || 0,
                    last_order_date: customer.date_modified || null
                });
            }
        });

        // Transform manual clients
        const transformedManualClients: Client[] = (manualClients || []).map((client: any) => ({
            id: client.id,
            name: `${client.first_name} ${client.last_name}`,
            email: client.email,
            phone: client.phone,
            address: client.address,
            city: client.city,
            source: 'manual' as const,
            supabase_id: client.id,
            order_count: 0, // TODO: Count orders per client
            last_order_date: null
        }));

        // Merge clients by phone number OR email
        const mergedClientsMap = new Map<string, Client>();

        // First add manual clients (use phone as key if available)
        transformedManualClients.forEach(client => {
            const key = client.phone || client.email;
            if (key) {
                mergedClientsMap.set(key, client);
            }
        });

        // Then merge WooCommerce clients
        Array.from(wcClientsMap.values()).forEach(wcClient => {
            const key = wcClient.phone || wcClient.email;
            if (!key) return;

            const existingClient = mergedClientsMap.get(key);
            if (existingClient) {
                // Merge: keep CRM client but add WC order count and last order date
                existingClient.order_count = (existingClient.order_count || 0) + (wcClient.order_count || 0);
                existingClient.last_order_date = wcClient.last_order_date;
            } else {
                // Add new WC client
                mergedClientsMap.set(key, wcClient);
            }
        });

        // Sort by last order date (most recent first), then by name
        const allClients = Array.from(mergedClientsMap.values())
            .sort((a, b) => {
                // Clients with orders first
                if (!a.last_order_date && b.last_order_date) return 1;
                if (a.last_order_date && !b.last_order_date) return -1;
                if (!a.last_order_date && !b.last_order_date) {
                    return a.name.localeCompare(b.name);
                }
                // Sort by date descending (most recent first)
                return new Date(b.last_order_date!).getTime() - new Date(a.last_order_date!).getTime();
            });

        // Calculate pagination metadata
        const totalCount = wcTotalCount + (manualTotalCount || 0);
        const totalPages = Math.ceil(totalCount / perPage);

        return NextResponse.json({
            clients: allClients,
            pagination: {
                currentPage: page,
                perPage,
                totalPages,
                totalCount,
                hasMore: page < totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
