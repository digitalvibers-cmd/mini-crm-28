import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function DELETE() {
    try {
        // First delete all items
        const { error: itemsError } = await supabase
            .from('weekly_menu_items')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (neq with impossible ID)

        if (itemsError) throw itemsError;

        // Then delete all menus
        const { error: menusError } = await supabase
            .from('weekly_menus')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (menusError) throw menusError;

        return NextResponse.json({
            success: true,
            message: 'All weekly menus and items deleted successfully'
        });

    } catch (error: any) {
        console.error('Delete all menus error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
