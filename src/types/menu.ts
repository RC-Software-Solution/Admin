export type MealType = "veg" | "non-veg" | "other";
export type MealTime = "breakfast" | "lunch" | "dinner";

export interface FoodItem {
    id: number;
    name: string;
    description: string | null;
    price: string | number; // DECIMAL: Sequelize serializes it as a string
    meal_type: MealType;
    image_url: string | null;
    is_active: boolean; // inactive items are hidden from customers and can't join new sessions
    category: string | null;
    dietary_tags: string | null; // comma-separated, e.g. "vegan, gluten-free"
}

export type FoodItemForm = Pick<FoodItem, "name" | "description" | "meal_type" | "image_url" | "category" | "dietary_tags"> & { price: string };

/** Row of GET /food-items/:id/price-history. old_price is null for the starting price. */
export interface PriceChange {
    id: number;
    old_price: string | null;
    new_price: string;
    changed_at: string;
}

export interface SessionItem {
    id: number;
    food_item_id: number;
    available_quantity: number | null; // null = unlimited
    foodItem: FoodItem;
}

export interface MealSession {
    id: number;
    date: string;
    meal_time: MealTime;
    start_time: string; // HH:MM:SS, Sri Lanka local
    end_time: string;
    sessionItems: SessionItem[];
}

export type SessionForm = Pick<MealSession, "date" | "meal_time" | "start_time" | "end_time">;
