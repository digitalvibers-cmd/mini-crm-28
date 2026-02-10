import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/weekly-menus/[id] - Get details and items
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        // 1. Fetch Menu Details
        const { data: menu, error: menuError } = await supabase
            .from('weekly_menus')
            .select(`
                *,
                program:programs(id, name)
            `)
            .eq('id', id)
            .single();

        if (menuError) {
            console.error('Error fetching menu:', menuError);
            return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
        }

        // 2. Fetch Items (Meals)
        const { data: items, error: itemsError } = await supabase
            .from('weekly_menu_items')
            .select(`
                *,
                meal:meals(id, name, description),
                category:meal_categories(id, name)
            `)
            .eq('weekly_menu_id', id);

        if (itemsError) {
            console.error('Error fetching items:', itemsError);
            // We can return the menu without items if items fail, or error out
            // Let's error out for consistency
            return NextResponse.json({ error: itemsError.message }, { status: 500 });
        }

        return NextResponse.json({
            menu: {
                ...menu,
                items: items || []
            }
        });

    } catch (error) {
        console.error('Error in GET /api/weekly-menus/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/weekly-menus/[id] - Delete a menu and its items
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ error: 'Menu ID is required' }, { status: 400 });
        }

        // First delete all items in this menu
        const { error: itemsError } = await supabase
            .from('weekly_menu_items')
            .delete()
            .eq('weekly_menu_id', id);

        if (itemsError) throw itemsError;

        // Then delete the menu itself
        const { error: menuError } = await supabase
            .from('weekly_menus')
            .delete()
            .eq('id', id);

        if (menuError) throw menuError;

        return NextResponse.json({
            success: true,
            message: 'Weekly menu deleted successfully'
        });

    } catch (error: any) {
        console.error('Delete menu error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
