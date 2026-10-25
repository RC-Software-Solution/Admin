export type OrderStatus = "pending" | "preparing" | "delivering" | "delivered" | "completed" | "cancelled" | "delivery_failed";
export type PaymentStatus = "pending" | "paid" | "unpaid" | "ignored";

export interface OrderItem {
    id: string;
    quantity: number;
    food_name: string;
}

/** Row of GET /orders. customer_name is added server-side for staff (null if user-service was unreachable). */
export interface Order {
    id: string;
    customer_id: string;
    customer_name?: string | null;
    area_id: number | string | null;
    status: OrderStatus;
    payment_status: PaymentStatus;
    total_price: string; // DECIMAL arrives as a string
    meal_time: string;
    created_at: string;
    order_items: OrderItem[];
}

export interface OrderFilters {
    status: OrderStatus | "";
    payment_status: PaymentStatus | "";
    area_id: string;
    from: string; // YYYY-MM-DD, Sri Lanka calendar day
    to: string;
    q: string; // order id prefix
}

/** Mirror of the backend's allowed moves (order-service utils/orderStatus.js); the server enforces them. */
export const NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
    pending: ["preparing", "cancelled"],
    preparing: ["delivering", "cancelled"],
    delivering: ["delivered", "delivery_failed"],
};
