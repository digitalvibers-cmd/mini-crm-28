-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed programs
INSERT INTO programs (name) VALUES 
('Program mršavljenja'),
('Program Zdrav život'),
('Program Posne ishrane'),
('Vegetarijanski program')
ON CONFLICT (name) DO NOTHING;

-- Create weekly_menus table
CREATE TABLE IF NOT EXISTS weekly_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create weekly_menu_items table
CREATE TABLE IF NOT EXISTS weekly_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_menu_id UUID NOT NULL REFERENCES weekly_menus(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1 = Monday, 7 = Sunday
  meal_category_id UUID NOT NULL REFERENCES meal_categories(id),
  meal_id UUID NOT NULL REFERENCES meals(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicates: One meal per category per day
  UNIQUE(weekly_menu_id, day_of_week, meal_category_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_menus_dates ON weekly_menus(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_weekly_menus_program ON weekly_menus(program_id);
CREATE INDEX IF NOT EXISTS idx_weekly_menu_items_menu ON weekly_menu_items(weekly_menu_id);
CREATE INDEX IF NOT EXISTS idx_weekly_menu_items_meal ON weekly_menu_items(meal_id);
