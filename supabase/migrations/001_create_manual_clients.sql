-- Migration: Create manual_clients table
-- Description: Stores manually created clients in CRM (not from WooCommerce)

CREATE TABLE IF NOT EXISTS manual_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  postcode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_manual_clients_email ON manual_clients(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_manual_clients_updated_at BEFORE UPDATE ON manual_clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE manual_clients IS 'Manually created clients from CRM (not WooCommerce)';
