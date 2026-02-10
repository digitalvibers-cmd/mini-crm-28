-- Migration 003: Create meal categories table
-- Description: Kategorije jela (Doručak, Ručak, Večera, Užina 1, Užina 2)

CREATE TABLE IF NOT EXISTS meal_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO meal_categories (name, display_order) VALUES
  ('Doručak', 1),
  ('Ručak', 2),
  ('Večera', 3),
  ('Užina 1', 4),
  ('Užina 2', 5)
ON CONFLICT (name) DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_meal_categories_display_order ON meal_categories(display_order);
