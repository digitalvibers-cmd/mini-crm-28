import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/ingredients/[id] - Detalji jedne namirnice
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const { data, error } = await supabase
            .from('ingredients')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Namirnica nije pronađena' },
                { status: 404 }
            );
        }

        return NextResponse.json({ ingredient: data });
    } catch (error) {
        console.error('Error fetching ingredient:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/ingredients/[id] - Ažuriranje namirnice
export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { name, unit, category, notes } = body;

        // Validation
        if (!name || !unit) {
            return NextResponse.json(
                { error: 'Name and unit are required' },
                { status: 400 }
            );
        }

        // Check if name is taken by another ingredient
        if (name) {
            const { data: existing } = await supabase
                .from('ingredients')
                .select('id')
                .eq('name', name)
                .neq('id', id)
                .single();

            if (existing) {
                return NextResponse.json(
                    { error: 'Namirnica sa ovim imenom već postoji' },
                    { status: 409 }
                );
            }
        }

        // Update ingredient
        const { data, error } = await supabase
            .from('ingredients')
            .update({ name, unit, category, notes })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, ingredient: data });
    } catch (error) {
        console.error('Error updating ingredient:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/ingredients/[id] - Brisanje namirnice
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        // Check if ingredient is used in any meals
        const { data: usageCheck } = await supabase
            .from('meal_ingredients')
            .select('id')
            .eq('ingredient_id', id)
            .limit(1);

        if (usageCheck && usageCheck.length > 0) {
            return NextResponse.json(
                { error: 'Namirnica se koristi u jelima i ne može biti obrisana' },
                { status: 409 }
            );
        }

        // Delete ingredient
        const { error } = await supabase
            .from('ingredients')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting ingredient:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
