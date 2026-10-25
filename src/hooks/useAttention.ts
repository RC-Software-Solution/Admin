import { getAttention } from "../services/attention.service";
import { usePolling } from "./usePolling";

/** The bell's counts, refreshed every 30s while the tab is visible. */
export const useAttention = () => {
    const { data, error } = usePolling(getAttention);
    const badge = data ? (data.pendingApprovals ?? 0) + (data.unpaidOrders ?? 0) + (data.failedDeliveries ?? 0) : 0;
    return { data, error, badge };
};
