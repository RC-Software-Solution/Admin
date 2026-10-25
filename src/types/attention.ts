/** GET /analytics/attention. A count is null when its source service could not be reached. */
export interface Attention {
    pendingApprovals: number | null; // customers waiting to be approved or rejected
    unpaidOrders: number | null;
    failedDeliveries: number | null;
    blockedUsers: number | null; // shown in the bell, but a state rather than a to-do, so not in the badge
}
