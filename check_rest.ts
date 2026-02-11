import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRest() {
    console.log('Checking REST API...', supabaseUrl);
    const { count, error } = await supabase.from('manual_clients').select('count', { count: 'exact', head: true });
    if (error) console.error('REST Error:', error);
    else console.log('REST Success! Count:', count);
}
checkRest();
