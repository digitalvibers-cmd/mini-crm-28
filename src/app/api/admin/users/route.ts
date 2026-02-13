import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client for user management
const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Check if the requester is an Admin
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        // 2. Parse request body
        const { email, password, role } = await request.json();

        if (!email || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 3. Create User using Admin Client
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 400 });
        }

        // 4. Create Profile for the new user
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: newUser.user.id,
                email: email,
                role: role
            });

        if (profileError) {
            // Rollback? Deleting the user if profile creation fails is a good idea given it's a new user.
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
            return NextResponse.json({ error: 'Failed to create user profile: ' + profileError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: newUser.user });

    } catch (error: any) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Check Admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Body
        const { id, email, password, role } = await request.json();
        if (!id) return NextResponse.json({ error: 'Missing User ID' }, { status: 400 });

        // 3. Update User (Auth)
        const updateData: any = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        if (email || password) {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);
            if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // 4. Update Profile (Role)
        if (role) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ role })
                .eq('id', id);

            if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Check Admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Parse URL for ID
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing User ID' }, { status: 400 });

        // 3. Delete User
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
