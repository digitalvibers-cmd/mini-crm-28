import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all clients with pagination from DB view
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const perPage = parseInt(searchParams.get('per_page') || '20'); // Default to 20 as requested
        const searchQuery = searchParams.get('search') || '';

        // Calculate offset
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;

        // Base query
        let query = supabase
            .from('all_clients_view')
            .select('*', { count: 'exact' });

        // Apply search filter if provided
        if (searchQuery) {
            query = query.or(
                `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
            );
        }

        // Apply sorting (default: last_order_date desc, then name asc)
        query = query.order('last_order_date', { ascending: false, nullsFirst: false })
            .order('name', { ascending: true });

        // Apply pagination
        query = query.range(from, to);

        const { data: clients, error, count } = await query;

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / perPage);

        return NextResponse.json({
            clients: clients || [],
            pagination: {
                currentPage: page,
                perPage,
                totalPages,
                totalCount,
                hasMore: page < totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
