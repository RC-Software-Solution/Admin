export interface DeliveryArea {
    area_id: number | string; // BIGINT: Sequelize may serialize it as a string
    area_name: string;
    code: string | null;
    status: "active" | "inactive";
    notes: string | null;
    assigned_users: number | null; // null when user-service was unreachable
}

/** Editable fields; the form sends all of them. */
export type AreaForm = Pick<DeliveryArea, "area_name" | "code" | "status" | "notes">;

/** Row of GET /analytics/area-metrics (all-time, per area). */
export interface AreaMetric {
    area_id: number | string;
    orderCount: number;
    totalRevenue: number;
}
