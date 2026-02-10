import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all manual orders (with client data)
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('manual_orders_with_client')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error fetching manual orders:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST create new manual order
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            client_id,
            product_name,
            start_date,
            duration_days,
            address,
            customer_note,
            payment_method
        } = body;

        // Validation
        if (!client_id || !product_name || !start_date || !duration_days || !address) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Insert order
        const { data, error } = await supabase
            .from('manual_orders')
            .insert([{
                client_id,
                product_name,
                start_date,
                duration_days: parseInt(duration_days),
                address,
                customer_note: customer_note || null,
                payment_method: payment_method || 'gotovina',
                status: 'processing'
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, order: data }, { status: 201 });
    } catch (error) {
        console.error('Error creating manual order:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
