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
}

export interface AreaRow {
    area_id: number | string;
    area_name: string;
    orderCount: number;
    totalRevenue: number;
    completedCount: number;
}

/** GET /analytics/dashboard. A section is null when its upstream failed (named in `errors`). */
export interface DashboardData {
    generatedAt: string;
    stats: {
        salesToday: number | null;
        salesWeek: number | null;
        ordersToday: { total: number; completed: number } | null;
        blockedUsers: number | null;
        unpaidOrders: number | null;
    };
    sessions: Record<MealType, SessionDay[] | null>;
    topItems: TopItemData[] | null;
    areas: AreaRow[] | null;
    errors: string[];
}
