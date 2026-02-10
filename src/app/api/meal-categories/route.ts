import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/meal-categories - Lista kategorija jela
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('meal_categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ categories: data || [] });
    } catch (error) {
        console.error('Error fetching meal categories:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
