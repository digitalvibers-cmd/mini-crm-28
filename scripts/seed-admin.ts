import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdmin() {
    const email = 'admin@28crm.com';
    const password = 'AdminPassword123!';

    console.log(`🌱 Seeding admin user: ${email}`);

    // 1. Check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('❌ Error listing users:', listError);
        return;
    }

    let userId;
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        console.log('ℹ️ User already exists.');
        userId = existingUser.id;
    } else {
        // 2. Create user if not exists
        const { data, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (createError) {
            console.error('❌ Error creating user:', createError);
            return;
        }

        console.log('✅ User created successfully.');
        userId = data.user.id;
    }

    // 3. Upsert Profile with Admin Role
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            email: email,
            role: 'admin'
        }, { onConflict: 'id' });

    if (profileError) {
        console.error('❌ Error creating admin profile:', profileError);
    } else {
        console.log('✅ Admin profile created/updated successfully.');
        console.log(`🔑 Credentials:\nEmail: ${email}\nPassword: ${password}`);
    }
}

seedAdmin();
