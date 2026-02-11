-- Create a table to cache expensive WooCommerce order aggregations
CREATE TABLE IF NOT EXISTS client_stats_cache (
    key text PRIMARY KEY, -- Phone number or email
    order_count integer DEFAULT 0,
    last_order_date text, -- Stored as ISO string for simplicity
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Index for faster lookups (PK is already indexed, but good to be explicit about intent)
-- CREATE INDEX IF NOT EXISTS idx_client_stats_cache_key ON client_stats_cache(key);

-- RLS Policies (Open for service_role/authenticated, read-only for anon if needed)
ALTER TABLE client_stats_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON client_stats_cache
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert/update for authenticated users" ON client_stats_cache
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
