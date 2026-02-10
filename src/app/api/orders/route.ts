import { NextResponse } from 'next/server';
import { wooCommerceApi } from '@/lib/woocommerce';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // Fetch WooCommerce orders
        const wcResponse = await wooCommerceApi.get("orders", {
            per_page: 20,
            orderby: 'date',
            order: 'desc'
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wcOrders = wcResponse.data.map((order: any) => {
            let startDate = "N/A";
            let duration = "N/A";
            let noteFromItems = "";

            for (const item of order.line_items) {
                if (item.meta_data && Array.isArray(item.meta_data)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const foundDate = item.meta_data.find((meta: any) =>
                        meta.key && (
                            meta.key.toLowerCase().includes('datum') ||
                            meta.key.toLowerCase().includes('start') ||
                            meta.key.toLowerCase().includes('početak') ||
                            meta.key === 'Odaberi datum kada startuje dostava:'
                        )
                    );
                    if (foundDate) startDate = foundDate.value;

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const foundDuration = item.meta_data.find((meta: any) =>
                        meta.key === 'pa_odaberite-trajanje-paketa' ||
                        meta.key === 'pa_program-duration' ||
                        meta.key === 'pa_период' ||
                        meta.key === 'pa_molimo-odaberite-trajanje-paketa' ||
                        meta.key === 'Molimo odaberite trajanje paketa' ||
                        meta.key === 'Trajanje' ||
                        meta.key === 'program-duration' ||
                        meta.key === 'период' ||
                        meta.key === 'odaberite-trajanje-paketa'
                    );
                    if (foundDuration) duration = foundDuration.value;

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const foundNote = item.meta_data.find((meta: any) =>
                        meta.key === 'Napomena' ||
                        meta.key === 'napomena' ||
                        meta.key.toLowerCase().includes('napomena')
                    );
                    if (foundNote) noteFromItems = foundNote.value;
                }
            }

            return {
                id: `#${order.id}`,
                customer: `${order.billing.first_name} ${order.billing.last_name}`,
                email: order.billing.email,
                address: `${order.billing.address_1}, ${order.billing.city}`,
                phone: order.billing.phone,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                product: order.line_items.map((item: any) => item.name).join(", "),
                payment_method: order.payment_method_title,
                originalStatus: order.status,
                startDate: startDate,
                duration: duration,
                note: order.customer_note || noteFromItems,
                source: 'woocommerce' as const
            };
        });

        // Fetch Supabase manual orders
        const { data: manualOrders, error } = await supabase
            .from('manual_orders_with_client')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            // Continue with just WooCommerce orders if Supabase fails
            return NextResponse.json(wcOrders);
        }

        // Transform Supabase orders to match WooCommerce format
        const transformedManualOrders = (manualOrders || []).map(order => {
            // Generate numeric ID from UUID (M-1234# format)
            const uuidHash = order.id.split('-').join('');
            const numericId = parseInt(uuidHash.substring(0, 8), 16) % 10000;
            const formattedId = numericId.toString().padStart(4, '0');

            // Format date from YYYY-MM-DD to DD-MM-YYYY to match WooCommerce
            const formatDate = (isoDate: string): string => {
                if (!isoDate) return 'N/A';
                const [year, month, day] = isoDate.split('-');
                return `${day}-${month}-${year}`;
            };

            return {
                id: `M-${formattedId}#`,
                customer: order.customer_name || 'Unknown',
                email: order.customer_email || '',
                address: order.address,
                phone: order.customer_phone || '',
                product: order.product_name,
                payment_method: order.payment_method || 'gotovina',
                originalStatus: order.status,
                startDate: formatDate(order.start_date),
                duration: `${order.duration_days} dana`,
                note: order.customer_note || '',
                source: 'manual' as const,
                supabase_id: order.id // Keep full UUID for edit/delete
            };
        });

        // Merge both sources (WC first, then manual)
        const allOrders = [...wcOrders, ...transformedManualOrders];

        // Sort by start date chronologically (newest first)
        allOrders.sort((a, b) => {
            // Parse DD-MM-YYYY format to Date object
            const parseDate = (dateStr: string): Date => {
                if (!dateStr || dateStr === 'N/A') return new Date(0); // Fallback for invalid dates
                const [day, month, year] = dateStr.split('-');
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            };

            const dateA = parseDate(a.startDate);
            const dateB = parseDate(b.startDate);

            // Sort descending (newest first)
            return dateB.getTime() - dateA.getTime();
        });

        return NextResponse.json(allOrders);
    } catch (error) {
        console.error("Orders API Error:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}
