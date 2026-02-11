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

// GET all orders for a specific client
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const decodedId = decodeURIComponent(id);

        let wcOrders: any[] = [];
        let manualOrders: any[] = [];

        if (isUUID(decodedId)) {
            // 1. Try Manual Clients
            const { data: manualClient } = await supabase
                .from('manual_clients')
                .select('phone, email') // Get email too
                .eq('id', decodedId)
                .single();

            if (manualClient) {
                // Fetch manual orders
                const { data: mOrders } = await supabase
                    .from('manual_orders_with_client')
                    .select('*')
                    .eq('client_id', decodedId)
                    .order('start_date', { ascending: false });
                manualOrders = mOrders || [];

                // Search Woo by phone/email
                if (manualClient.phone || manualClient.email) {
                    try {
                        const searchValue = manualClient.phone || manualClient.email; // Search by phone preferrably? Or just search.
                        const wcResponse = await api.get('orders', {
                            search: searchValue, // API searches both
                            per_page: 100
                        });

                        // Filter properly
                        const normalizePhone = (phone: string) => phone?.replace(/[\s-]/g, '') || '';
                        const targetPhone = normalizePhone(manualClient.phone);
                        const targetEmail = manualClient.email?.toLowerCase();

                        wcOrders = (wcResponse.data || []).filter((order: any) => {
                            const pMatch = targetPhone && normalizePhone(order.billing?.phone) === targetPhone;
                            const eMatch = targetEmail && order.billing?.email?.toLowerCase() === targetEmail;
                            return pMatch || eMatch;
                        });
                    } catch (e) { console.error(e); }
                }
            } else {
                // 2. Try Cached Clients
                const { data: cachedClient } = await supabase
                    .from('cached_clients')
                    .select('phone, email')
                    .eq('id', decodedId)
                    .single();

                if (cachedClient) {
                    // Get Woo orders for this cached client
                    if (cachedClient.phone || cachedClient.email) {
                        try {
                            const searchValue = cachedClient.phone || cachedClient.email;
                            const wcResponse = await api.get('orders', {
                                search: searchValue,
                                per_page: 100
                            });

                            // Filter properly
                            const normalizePhone = (phone: string) => phone?.replace(/[\s-]/g, '') || '';
                            const targetPhone = normalizePhone(cachedClient.phone);
                            const targetEmail = cachedClient.email?.toLowerCase();

                            wcOrders = (wcResponse.data || []).filter((order: any) => {
                                const pMatch = targetPhone && normalizePhone(order.billing?.phone) === targetPhone;
                                const eMatch = targetEmail && order.billing?.email?.toLowerCase() === targetEmail;
                                return pMatch || eMatch;
                            });
                        } catch (e) { console.error(e); }
                    }
                }
            }
        } else {
            // WooCommerce client - fetch by phone or email (legacy)
            try {
                // Use robust search that finds Guests and matches Phone/Email
                const wcResponse = await api.get('orders', {
                    search: decodedId,
                    per_page: 100
                });

                // Robust filtering to match Phone OR Email
                wcOrders = (wcResponse.data || []).filter((order: any) => {
                    const normalizePhone = (phone: string) => phone?.replace(/[\s-]/g, '') || '';
                    const phoneMatch = normalizePhone(order.billing?.phone) === normalizePhone(decodedId);
                    const emailMatch = order.billing?.email?.toLowerCase() === decodedId.toLowerCase();
                    return phoneMatch || emailMatch;
                });
            } catch (wcError) {
                console.error('WooCommerce API error:', wcError);
            }
        }

        // Transform WooCommerce orders
        const transformedWcOrders = wcOrders.map((order: any) => {
            let startDate = "N/A";
            let duration = "N/A";

            for (const item of order.line_items) {
                if (item.meta_data && Array.isArray(item.meta_data)) {
                    const foundDate = item.meta_data.find((meta: any) =>
                        meta.key && (
                            meta.key.toLowerCase().includes('datum') ||
                            meta.key.toLowerCase().includes('start') ||
                            meta.key.toLowerCase().includes('početak')
                        )
                    );
                    if (foundDate) startDate = foundDate.value;

                    const foundDuration = item.meta_data.find((meta: any) =>
                        meta.key === 'pa_odaberite-trajanje-paketa' ||
                        meta.key === 'pa_program-duration'
                    );
                    if (foundDuration) duration = foundDuration.value;
                }
            }

            return {
                id: `#${order.id}`,
                product: order.line_items.map((item: any) => item.name).join(", "),
                startDate: startDate,
                date: order.date_created, // Added date field
                duration: duration,
                status: order.status,
                payment_method: order.payment_method_title,
                source: 'woocommerce' as const
            };
        });

        // Transform manual orders
        const transformedManualOrders = manualOrders.map(order => {
            const uuidHash = order.id.split('-').join('');
            const numericId = parseInt(uuidHash.substring(0, 8), 16) % 10000;
            const formattedId = numericId.toString().padStart(4, '0');

            const formatDate = (isoDate: string): string => {
                if (!isoDate) return 'N/A';
                const [year, month, day] = isoDate.split('-');
                return `${day}-${month}-${year}`;
            };

            return {
                id: `M-${formattedId}#`,
                product: order.product_name,
                startDate: formatDate(order.start_date),
                date: order.created_at || order.start_date, // Added date field (fallback to start_date)
                duration: `${order.duration_days} dana`,
                status: order.status,
                payment_method: order.payment_method || 'gotovina',
                source: 'manual' as const,
                supabase_id: order.id
            };
        });

        // Merge and sort all orders
        const allOrders = [...transformedWcOrders, ...transformedManualOrders];

        // Sort by start date chronologically (newest first)
        allOrders.sort((a, b) => {
            const parseDate = (dateStr: string): Date => {
                if (!dateStr || dateStr === 'N/A') return new Date(0);
                const [day, month, year] = dateStr.split('-');
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            };

            const dateA = parseDate(a.startDate);
            const dateB = parseDate(b.startDate);

            return dateB.getTime() - dateA.getTime();
        });

        return NextResponse.json(allOrders);
    } catch (error) {
        console.error('Error fetching client orders:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
