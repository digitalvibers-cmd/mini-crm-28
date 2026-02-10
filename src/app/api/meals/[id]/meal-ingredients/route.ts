import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: mealId } = await context.params;
        const body = await request.json();

        const { ingredient_id, quantity, notes } = body;

        // Validate required fields
        if (!ingredient_id || !quantity) {
            return NextResponse.json(
                { error: 'ingredient_id and quantity are required' },
                { status: 400 }
            );
        }

        // Validate quantity is positive
        if (quantity <= 0) {
            return NextResponse.json(
                { error: 'Quantity must be greater than 0' },
                { status: 400 }
            );
        }

        // Check if ingredient exists
        const { data: ingredient } = await supabase
            .from('ingredients')
            .select('id')
            .eq('id', ingredient_id)
            .single();

        if (!ingredient) {
            return NextResponse.json(
                { error: 'Ingredient not found' },
                { status: 404 }
            );
        }

        // Check if meal exists
        const { data: meal } = await supabase
            .from('meals')
            .select('id')
            .eq('id', mealId)
            .single();

        if (!meal) {
            return NextResponse.json(
                { error: 'Meal not found' },
                { status: 404 }
            );
        }

        // Check if ingredient already added to this meal
        const { data: existing } = await supabase
            .from('meal_ingredients')
            .select('id')
            .eq('meal_id', mealId)
            .eq('ingredient_id', ingredient_id)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'Ingredient already added to this meal' },
                { status: 400 }
            );
        }

        // Add ingredient to meal
        const { data: mealIngredient, error } = await supabase
            .from('meal_ingredients')
            .insert({
                meal_id: mealId,
                ingredient_id,
                quantity: parseFloat(quantity),
                notes: notes || null
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding ingredient to meal:', error);
            return NextResponse.json(
                { error: 'Failed to add ingredient to meal' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'Ingredient added successfully',
            mealIngredient
        }, { status: 201 });

    } catch (error) {
        console.error('Error in POST /api/meals/[id]/ingredients:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: mealId } = await context.params;

        // Get all ingredients for this meal
        const { data: mealIngredients, error } = await supabase
            .from('meal_ingredients')
            .select(`
                *,
                ingredient:ingredients (*)
            `)
            .eq('meal_id', mealId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching meal ingredients:', error);
            return NextResponse.json(
                { error: 'Failed to fetch meal ingredients' },
                { status: 500 }
            );
        }

        return NextResponse.json({ ingredients: mealIngredients || [] });

    } catch (error) {
        console.error('Error in GET /api/meals/[id]/ingredients:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/meals/[meal_id]/meal-ingredients?ingredient_id=[uuid]
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: mealId } = await context.params;
        const { searchParams } = new URL(request.url);
        const ingredientId = searchParams.get('ingredient_id');

        if (!ingredientId) {
            return NextResponse.json(
                { error: 'Ingredient ID is required' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('meal_ingredients')
            .delete()
            .eq('meal_id', mealId)
            .eq('ingredient_id', ingredientId);

        if (error) throw error;

        return NextResponse.json({ message: 'Ingredient removed successfully' });
    } catch (error) {
        console.error('Error removing ingredient:', error);
        return NextResponse.json(
            { error: 'Failed to remove ingredient' },
            { status: 500 }
        );
    }
}
