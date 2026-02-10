import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/meals - Lista jela sa filterima
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const category = searchParams.get('category');

        let query = supabase
            .from('meals')
            .select(`
                *,
                category:meal_categories(id, name, display_order)
            `)
            .order('name', { ascending: true });

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        if (category) {
            query = query.eq('category_id', category);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ meals: data || [] });
    } catch (error) {
        console.error('Error fetching meals:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/meals - Kreiranje novog jela
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, category_id } = body;

        // Validation
        if (!name || !category_id) {
            return NextResponse.json(
                { error: 'Name and category are required' },
                { status: 400 }
            );
        }

        // Check for duplicate name
        const { data: existing } = await supabase
            .from('meals')
            .select('id')
            .eq('name', name)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'Jelo sa ovim imenom već postoji' },
                { status: 409 }
            );
        }

        // Create meal
        const { data, error } = await supabase
            .from('meals')
            .insert([{
                name,
                description,
                category_id
            }])
            .select(`
                *,
                category:meal_categories(id, name, display_order)
            `)
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, meal: data }, { status: 201 });
    } catch (error) {
        console.error('Error creating meal:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
