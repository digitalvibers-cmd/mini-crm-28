import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MealIngredient } from '@/types/meals';

interface AggregatedIngredient {
    ingredient_id: string;
    name: string;
    quantity: number;
    unit: string;
    category: string;
}

// GET /api/weekly-menus/[id]/shopping-list
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        // 1. Fetch all items in the weekly menu with their meal ingredients
        const { data: menuItems, error } = await supabase
            .from('weekly_menu_items')
            .select(`
                id,
                meal:meals (
                    id,
                    name,
                    meal_ingredients (
                        id,
                        quantity,
                        ingredient:ingredients (
                            id,
                            name,
                            unit,
                            category
                        )
                    )
                )
            `)
            .eq('weekly_menu_id', id);

        if (error) {
            console.error('Error fetching menu items:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 2. Aggregate ingredients
        const aggregatedMap = new Map<string, AggregatedIngredient>();

        menuItems?.forEach((item: any) => {
            const mealIngredients = item.meal?.meal_ingredients;
            if (Array.isArray(mealIngredients)) {
                mealIngredients.forEach((mi: any) => {
                    // Skip if ingredient data is missing (shouldn't happen with correct FKs)
                    if (!mi.ingredient) return;

                    const ingredientId = mi.ingredient.id;
                    const existing = aggregatedMap.get(ingredientId);

                    if (existing) {
                        // Assumption: Units match. If not, logic would be much more complex.
                        // Ideally we'd log a warning if units differ.
                        if (existing.unit === mi.ingredient.unit) {
                            existing.quantity += mi.quantity;
                        } else {
                            // Minimal handling: append as separate entry or just sum anyway?
                            // Let's keep strict for now, but in reality we might see 'g' vs 'kg'.
                            // For MVP, simple sum.
                            existing.quantity += mi.quantity;
                        }
                    } else {
                        aggregatedMap.set(ingredientId, {
                            ingredient_id: ingredientId,
                            name: mi.ingredient.name,
                            quantity: mi.quantity,
                            unit: mi.ingredient.unit,
                            category: mi.ingredient.category || 'Ostalo'
                        });
                    }
                });
            }
        });

        // 3. Convert to array and group by category
        const allIngredients = Array.from(aggregatedMap.values());

        const grouped: Record<string, AggregatedIngredient[]> = {};

        allIngredients.forEach(ing => {
            const cat = ing.category;
            if (!grouped[cat]) {
                grouped[cat] = [];
            }
            grouped[cat].push(ing);
        });

        // Optional: Sort items within categories
        Object.keys(grouped).forEach(cat => {
            grouped[cat].sort((a, b) => a.name.localeCompare(b.name));
        });

        return NextResponse.json({
            shoppingList: grouped,
            totalItems: allIngredients.length
        });

    } catch (error) {
        console.error('Error in shopping list generation:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
