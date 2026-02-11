const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to database...');
        await client.connect();

        console.log('Reading migration file...');
        const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/010_client_stats_cache.sql'), 'utf8');

        console.log('Executing migration...');
        const res = await client.query(sql);
        console.log('Migration successful:', res);
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

run();
