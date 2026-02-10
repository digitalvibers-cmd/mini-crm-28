import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/programs
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('programs')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ programs: data || [] });
    } catch (error) {
        console.error('Error fetching programs:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
