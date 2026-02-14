export type SessionTab = "Breakfast" | "Lunch" | "Dinner";
export type SessionStatus = "completed" | "pending" | "cancelled";

export interface SessionRowData {
    date: string;
    orders: number;
    amount: string;
    status: SessionStatus;
}

export interface TopItemData {
    img: string;
    name: string;
    price: string;
    sold: number;
}

export interface AreaRow {
    area: string;
    orders: number;
    revenue: string;
    rate: number;
}
