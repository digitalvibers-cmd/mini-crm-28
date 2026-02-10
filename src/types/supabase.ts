// Manual Clients (Supabase)
export interface ManualClient {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postcode?: string;
    created_at: string;
    updated_at: string;
}

// Manual Orders (Supabase)
export interface ManualOrder {
    id: string;
    client_id: string;
    product_name: string;
    start_date: string; // ISO date string
    duration_days: number;
    address: string;
    customer_note?: string;
    payment_method: string;
    status: string;
    created_at: string;
    updated_at: string;
}

// Manual Orders with Client Data (from view)
export interface ManualOrderWithClient extends ManualOrder {
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
}

// Unified Order type (WooCommerce + Supabase)
export interface UnifiedOrder {
    id: string;
    customer: string;
    email: string;
    address: string;
    phone: string;
    product: string;
    payment_method: string;
    startDate: string;
    duration: string;
    note?: string;
    source: 'woocommerce' | 'manual';
    supabase_id?: string; // Only for manual orders
}
