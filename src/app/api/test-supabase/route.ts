import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Test Supabase connection
export async function GET() {
    try {
        // Test query to manual_clients table
        const { data, error } = await supabase
            .from('manual_clients')
            .select('*')
            .limit(5);

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json(
                { error: 'Database connection failed', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Supabase connection successful',
            clients: data,
            count: data?.length || 0
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}
