import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/weekly-menus/[id]/items - Add item to menu
export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: weekly_menu_id } = await context.params;
        const body = await request.json();
        const { day_of_week, meal_category_id, meal_id } = body;

        if (!day_of_week || !meal_category_id || !meal_id) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('weekly_menu_items')
            .insert([{
                weekly_menu_id,
                day_of_week,
                meal_category_id,
                meal_id
            }])
            .select(`
                *,
                meal:meals(id, name, description),
                category:meal_categories(id, name)
            `)
            .single();

        if (error) {
            console.error('Error adding item:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ item: data }, { status: 201 });

    } catch (error) {
        console.error('Error in POST /api/weekly-menus/[id]/items:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/weekly-menus/[id]/items?id=[item_id]
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: weekly_menu_id } = await context.params;
        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get('id');

        if (!itemId) {
            return NextResponse.json(
                { error: 'Item ID is required' },
                { status: 400 }
            );
        }

        // Verify item belongs to menu (security)
        const { error } = await supabase
            .from('weekly_menu_items')
            .delete()
            .eq('id', itemId)
            .eq('weekly_menu_id', weekly_menu_id);

        if (error) {
            console.error('Error deleting item:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in DELETE /api/weekly-menus/[id]/items:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
