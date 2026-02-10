export interface Program {
    id: string;
    name: string;
    description?: string;
    created_at: string;
}

export interface WeeklyMenu {
    id: string;
    program_id: string;
    program?: Program;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface WeeklyMenuItem {
    id: string;
    weekly_menu_id: string;
    day_of_week: number; // 1-7
    meal_category_id: string;
    meal_id: string;
    created_at: string;

    // Joined data
    meal?: {
        id: string;
        name: string;
        description?: string;
    };
    category?: {
        id: string;
        name: string;
    };
}
