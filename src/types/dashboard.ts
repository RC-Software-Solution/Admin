export type MealType = "breakfast" | "lunch" | "dinner";

export interface SessionDay {
    date: string; // YYYY-MM-DD, Sri Lanka calendar day
    orderCount: number;
    totalRevenue: number;
}

export interface TopItemData {
    food_name: string;
    total_quantity: number;
    total_revenue: number;
    image_url: string | null; // matched by name from menu-service; null when the item has no picture
}

export interface AreaRow {
    area_id: number | string;
    area_name: string;
    orderCount: number;
    totalRevenue: number;
    completedCount: number;
}

/** change = percent versus the previous range of equal length; null when that range had nothing to compare. */
export interface DashboardData {
    generatedAt: string;
    range: { from: string; to: string; prevFrom: string; prevTo: string; areaId: string | null; session: MealType | null };
    stats: {
        sales: { value: number; prev: number; change: number | null } | null;
        orders: { total: number; completed: number; prevTotal: number; change: number | null } | null;
        blockedUsers: number | null; // right now, not range-based
        unpaidOrders: number | null; // right now, not range-based
    };
    sessions: Record<MealType, SessionDay[] | null>;
    topItems: TopItemData[] | null;
    areas: AreaRow[] | null;
    errors: string[]; // sections that could not be loaded (their value above is null)
}

/** GET /analytics/dashboard query: a Sri Lanka day range plus optional area and session filters. */
export interface DashboardQuery {
    from: string;
    to: string;
    areaId: string; // "" = all areas
    session: MealType | ""; // "" = all sessions
}
