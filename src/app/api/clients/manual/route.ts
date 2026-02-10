import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all manual clients
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('manual_clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error fetching manual clients:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST create new manual client
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            postcode
        } = body;

        // Validation
        if (!first_name || !last_name || !email) {
            return NextResponse.json(
                { error: 'Missing required fields (first_name, last_name, email)' },
                { status: 400 }
            );
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Check for duplicate email
        const { data: existing } = await supabase
            .from('manual_clients')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'Client with this email already exists' },
                { status: 409 }
            );
        }

        // Insert client
        const { data, error } = await supabase
            .from('manual_clients')
            .insert([{
                first_name,
                last_name,
                email,
                phone: phone || null,
                address: address || null,
                city: city || null,
                postcode: postcode || null
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, client: data }, { status: 201 });
    } catch (error) {
        console.error('Error creating manual client:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
