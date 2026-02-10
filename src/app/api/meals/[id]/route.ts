import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/meals/[id] - Detalji jednog jela
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const { data, error } = await supabase
            .from('meals')
            .select(`
                *,
                category:meal_categories(id, name, display_order),
                ingredients:meal_ingredients(
                    id,
                    quantity,
                    notes,
                    ingredient:ingredients(id, name, unit, category)
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Jelo nije pronađeno' },
                { status: 404 }
            );
        }

        return NextResponse.json({ meal: data });
    } catch (error) {
        console.error('Error fetching meal:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/meals/[id] - Ažuriranje jela
export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { name, description, category_id } = body;

        // Validation
        if (!name || !category_id) {
            return NextResponse.json(
                { error: 'Name and category are required' },
                { status: 400 }
            );
        }

        // Check if name is taken by another meal
        const { data: existing } = await supabase
            .from('meals')
            .select('id')
            .eq('name', name)
            .neq('id', id)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'Jelo sa ovim imenom već postoji' },
                { status: 409 }
            );
        }

        // Update meal
        const { data, error } = await supabase
            .from('meals')
            .update({
                name,
                description,
                category_id
            })
            .eq('id', id)
            .select(`
                *,
                category:meal_categories(id, name, display_order)
            `)
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, meal: data });
    } catch (error) {
        console.error('Error updating meal:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/meals/[id] - Brisanje jela
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        // Delete meal (cascade will handle meal_ingredients)
        const { error } = await supabase
            .from('meals')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting meal:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
