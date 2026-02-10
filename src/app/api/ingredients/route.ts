import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/ingredients - Lista svih namirnica
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const category = searchParams.get('category');

        let query = supabase
            .from('ingredients')
            .select('*')
            .order('name', { ascending: true });

        // Search filter
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        // Category filter
        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ingredients: data || [] });
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/ingredients - Kreiranje nove namirnice
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, unit, category, notes } = body;

        // Validation
        if (!name || !unit) {
            return NextResponse.json(
                { error: 'Name and unit are required' },
                { status: 400 }
            );
        }

        // Check if ingredient already exists
        const { data: existing } = await supabase
            .from('ingredients')
            .select('id')
            .eq('name', name)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'Namirnica sa ovim imenom već postoji' },
                { status: 409 }
            );
        }

        // Insert new ingredient
        const { data, error } = await supabase
            .from('ingredients')
            .insert([{ name, unit, category, notes }])
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, ingredient: data }, { status: 201 });
    } catch (error) {
        console.error('Error creating ingredient:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
