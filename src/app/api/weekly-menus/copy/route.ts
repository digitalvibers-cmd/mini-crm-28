import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {

    try {
        const body = await request.json();
        const { source_menu_id, target_menu_id } = body;

        if (!source_menu_id || !target_menu_id) {
            return NextResponse.json({ error: 'Source and Target menu IDs are required' }, { status: 400 });
        }

        // 1. Fetch items from source
        const { data: sourceItems, error: fetchError } = await supabase
            .from('weekly_menu_items')
            .select('*')
            .eq('weekly_menu_id', source_menu_id);

        if (fetchError) throw fetchError;
        if (!sourceItems || sourceItems.length === 0) {
            return NextResponse.json({ message: 'No items to copy', count: 0 });
        }

        // 2. Prepare items for target
        // We need to map them to the new menu_id, but keep day, meal_id, category_id
        const newItems = sourceItems.map(item => ({
            weekly_menu_id: target_menu_id,
            day_of_week: item.day_of_week,
            meal_category_id: item.meal_category_id,
            meal_id: item.meal_id
        }));

        // 3. Delete existing items in target menu first (Replace All behavior)
        const { error: deleteError } = await supabase
            .from('weekly_menu_items')
            .delete()
            .eq('weekly_menu_id', target_menu_id);

        if (deleteError) throw deleteError;

        // 4. Insert new items into target
        const { error: insertError } = await supabase
            .from('weekly_menu_items')
            .insert(newItems);

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, count: newItems.length });

    } catch (error: any) {
        console.error('Copy items error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
