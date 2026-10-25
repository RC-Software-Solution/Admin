import { dashboardQueryString, getDashboard } from "../Pages/Dashboard/dashboard.service";
import { usePolling } from "./usePolling";
import { useRangeFilters } from "./useRangeFilters";

export type { Preset } from "./useRangeFilters";

const POLL_MS = 30_000;

export const useDashboard = () => {
    const filters = useRangeFilters();
    const { query, areaId, session } = filters;

    const { data, error, updatedAt, refresh } = usePolling((signal) => getDashboard(query, signal), POLL_MS, dashboardQueryString(query));

    // The filters changed and the matching response has not arrived yet: the old numbers are shown dimmed
    const loading =
        !!data && (data.range.from !== query.from || data.range.to !== query.to || (data.range.areaId ?? "") !== areaId || (data.range.session ?? "") !== session);

    return {
        data, error, updatedAt, refresh, loading,
        ...filters,
    };
};
