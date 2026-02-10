-- Migration: Create manual_orders table
-- Description: Stores manually created orders in CRM (not from WooCommerce)

CREATE TABLE IF NOT EXISTS manual_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES manual_clients(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 1,
  address TEXT NOT NULL,
  customer_note TEXT,
  payment_method TEXT DEFAULT 'gotovina',
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_manual_orders_client_id ON manual_orders(client_id);
CREATE INDEX idx_manual_orders_start_date ON manual_orders(start_date);
CREATE INDEX idx_manual_orders_status ON manual_orders(status);

-- Create updated_at trigger
CREATE TRIGGER update_manual_orders_updated_at BEFORE UPDATE ON manual_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for easy querying with client data
CREATE OR REPLACE VIEW manual_orders_with_client AS
SELECT 
  o.id,
  o.client_id,
  c.first_name || ' ' || c.last_name AS customer_name,
  c.email AS customer_email,
  c.phone AS customer_phone,
  o.product_name,
  o.start_date,
  o.duration_days,
  o.address,
  o.customer_note,
  o.payment_method,
  o.status,
  o.created_at,
  o.updated_at
FROM manual_orders o
LEFT JOIN manual_clients c ON o.client_id = c.id;

COMMENT ON TABLE manual_orders IS 'Manually created orders from CRM (not WooCommerce)';
COMMENT ON VIEW manual_orders_with_client IS 'Orders joined with client information for easy querying';
