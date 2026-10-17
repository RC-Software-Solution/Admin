import type { AreaRow, MealType, SessionDay, TopItemData } from "./dashboard";

export type ReportType = "sales" | "items" | "areas";

export type SalesDayRow = SessionDay; // one Sri Lanka day, summed across sessions
export type ItemRow = Omit<TopItemData, "image_url">;
export type { AreaRow };

/** GET /analytics/reports/:type */
export interface Report<T> {
    range: { from: string; to: string; areaId: string | null; session: MealType | null };
    data: T[];
}
