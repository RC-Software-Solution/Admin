export interface AuditRow {
    id: number;
    actor_id: string | null;
    actor_name: string | null;
    actor_role: string | null;
    action: string; // "<group>.<verb>", e.g. order.payment
    target_type: string;
    target_id: string | null;
    details: Record<string, unknown> | null; // only the whitelisted fields the route chose to record
    created_at: string;
}

/** GET /users/audit-logs */
export interface AuditPage {
    total: number;
    page_size: number;
    rows: AuditRow[];
}

export interface AuditQuery {
    from: string; // Sri Lanka day
    to: string;
    group: string; // "" = everything
    page: number; // 1-based
}

/** The `group` filter: the part of an action before the dot. */
export const AUDIT_GROUPS: { id: string; label: string }[] = [
    { id: "admin", label: "Admins" },
    { id: "customer", label: "Customer reminders" },
    { id: "driver", label: "Delivery persons" },
    { id: "settings", label: "Settings" },
    { id: "order", label: "Orders" },
    { id: "notice", label: "Notices" },
    { id: "area", label: "Delivery areas" },
    { id: "food_item", label: "Food items" },
    { id: "session", label: "Sessions" },
    { id: "session_item", label: "Session items" },
];
