import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/weekly-menus - List all weekly menus
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('start_date');

        let query = supabase
            .from('weekly_menus')
            .select(`
                *,
                program:programs(id, name)
            `)
            .order('start_date', { ascending: true });

        if (startDate) {
            query = query.eq('start_date', startDate);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ menus: data || [] });
    } catch (error) {
        console.error('Error fetching weekly menus:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/weekly-menus - Create a new weekly menu (single or bulk)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { program_id, program_ids, name, start_date, end_date } = body;

        // Validation for date and name
        if (!name || !start_date || !end_date) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Determine list of programs to create for
        const targetProgramIds: string[] = [];
        if (Array.isArray(program_ids) && program_ids.length > 0) {
            targetProgramIds.push(...program_ids);
        } else if (program_id) {
            targetProgramIds.push(program_id);
        } else {
            return NextResponse.json(
                { error: 'No programs selected' },
                { status: 400 }
            );
        }

        // Create payload for bulk insert
        const payload = targetProgramIds.map(pid => ({
            program_id: pid,
            name,
            start_date,
            end_date,
            is_active: false
        }));

        // Create
        const { data, error } = await supabase
            .from('weekly_menus')
            .insert(payload)
            .select(`
                *,
                program:programs(id, name)
            `);

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, menus: data }, { status: 201 });
    } catch (error) {
        console.error('Error creating weekly menus:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
