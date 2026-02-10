-- Add nutrition columns to meals table
ALTER TABLE meals
ADD COLUMN calories INTEGER,
ADD COLUMN protein NUMERIC(6,2),
ADD COLUMN carbs NUMERIC(6,2),
ADD COLUMN fats NUMERIC(6,2);

-- Add comments for clarity
COMMENT ON COLUMN meals.calories IS 'Calories in kcal';
COMMENT ON COLUMN meals.protein IS 'Protein in grams';
COMMENT ON COLUMN meals.carbs IS 'Carbohydrates in grams';
COMMENT ON COLUMN meals.fats IS 'Fats in grams';
