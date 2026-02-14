export type AreaStatus = "active" | "inactive";

export interface DeliveryArea {
    id: string;
    name: string;
    code: string;
    status: AreaStatus;
    ordersToday: number;
    assignedUsers: number;
    deliveryFee: number;
}
