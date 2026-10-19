import type { OrderStatus, PaymentStatus } from "./orders";
export type UserStatus = "pending" | "accepted" | "rejected" | "disabled" | "blocked";

/** Row from GET /users/customers (password and refresh_token are stripped server-side). */
export interface Customer {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    address: string | null;
    area_id: number | string | null; // BIGINT: may serialize as a string
    approved: boolean;
    customer_status: UserStatus | null; // null on legacy rows; see statusOf()
    rejection_reason: string | null;
    blocked_reason: string | null;
    created_at: string;
}

export interface StatusLogEntry {
    id: number | string;
    previous_status: string | null;
    new_status: string;
    reason: string | null;
    performed_by: string | null;
    created_at: string;
}

export interface CustomerOrder {
    id: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    total_price: string; // DECIMAL arrives as a string
    meal_time: string;
    created_at: string;
}

/** GET /users/customers/:id/profile */
export interface CustomerProfile extends Customer {
    order_history: CustomerOrder[];
    status_log: StatusLogEntry[];
}

export type UserTab = {
    key: UserStatus;
    label: string;
};

/** Legacy accounts approved before customer_status existed have it null. */
export const statusOf = (c: Customer): UserStatus => c.customer_status ?? (c.approved ? "accepted" : "pending");
