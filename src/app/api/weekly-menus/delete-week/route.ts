import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { start_date } = body;

        if (!start_date) {
            return NextResponse.json({ error: 'start_date is required' }, { status: 400 });
        }

        // 1. Fetch all menus for this week
        const { data: menus, error: fetchError } = await supabase
            .from('weekly_menus')
            .select('id')
            .eq('start_date', start_date);

        if (fetchError) throw fetchError;

        if (!menus || menus.length === 0) {
            return NextResponse.json({ message: 'No menus found for this week', count: 0 });
        }

        const menuIds = menus.map(m => m.id);

        // 2. Delete all items for these menus
        const { error: itemsError } = await supabase
            .from('weekly_menu_items')
            .delete()
            .in('weekly_menu_id', menuIds);

        if (itemsError) throw itemsError;

        // 3. Delete all menus
        const { error: menusError } = await supabase
            .from('weekly_menus')
            .delete()
            .in('id', menuIds);

        if (menusError) throw menusError;

        return NextResponse.json({
            success: true,
            message: 'All weekly menus deleted successfully',
            count: menuIds.length
        });

    } catch (error: any) {
        console.error('Delete week error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
