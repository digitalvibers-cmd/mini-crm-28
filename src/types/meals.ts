// TypeScript types for Meals Module

export interface MealCategory {
    id: string;
    name: string;
    display_order: number;
    icon?: string;
    created_at: string;
}

export interface Meal {
    id: string;
    name: string;
    category_id: string;
    category?: MealCategory;
    description?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export type IngredientUnit = 'kg' | 'g' | 'L' | 'ml' | 'kom' | 'pakovanje';

export interface Ingredient {
    id: string;
    name: string;
    unit: IngredientUnit;
    category?: string;
    notes?: string;
    created_at: string;
}

export interface MealIngredient {
    id: string;
    meal_id: string;
    ingredient_id: string;
    ingredient?: Ingredient;
    quantity: number;
    notes?: string;
    created_at: string;
}

// Form types
export interface CreateMealInput {
    name: string;
    category_id: string;
    description?: string;
}

export interface UpdateMealInput {
    name?: string;
    category_id?: string;
    description?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    is_active?: boolean;
}

export interface CreateIngredientInput {
    name: string;
    unit: IngredientUnit;
    category?: string;
    notes?: string;
}

export interface UpdateIngredientInput {
    name?: string;
    unit?: IngredientUnit;
    category?: string;
    notes?: string;
}

export interface AddMealIngredientInput {
    ingredient_id: string;
    quantity: number;
    notes?: string;
}

export interface UpdateMealIngredientInput {
    quantity?: number;
    notes?: string;
}
