-- Migration: Change unique constraint from email to phone
-- Description: Changes the primary merge key for clients from email to phone number

-- First, drop the existing unique constraint and index on email
ALTER TABLE manual_clients DROP CONSTRAINT IF EXISTS manual_clients_email_key;
DROP INDEX IF EXISTS idx_manual_clients_email;

-- Make phone NOT NULL since we're using it as the unique identifier
-- But first check if there are any NULL values
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM manual_clients WHERE phone IS NULL OR phone = ''
    ) THEN
        RAISE EXCEPTION 'Cannot make phone NOT NULL: there are existing records with NULL or empty phone values';
    END IF;
END $$;

-- Now we can safely add NOT NULL constraint
ALTER TABLE manual_clients ALTER COLUMN phone SET NOT NULL;

-- Add unique constraint on phone
ALTER TABLE manual_clients ADD CONSTRAINT manual_clients_phone_key UNIQUE (phone);

-- Create index on phone for faster lookups
CREATE INDEX idx_manual_clients_phone ON manual_clients(phone);

-- Keep email but make it optional (it already is)
-- We'll still keep an index on email for searching purposes
CREATE INDEX idx_manual_clients_email_search ON manual_clients(email);

COMMENT ON COLUMN manual_clients.phone IS 'Phone number - used as unique identifier for merging with WooCommerce customers';
COMMENT ON COLUMN manual_clients.email IS 'Email address - optional, used for contact purposes only';
