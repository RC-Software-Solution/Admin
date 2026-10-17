import { useCallback, useEffect, useState } from "react";
import type { Report, ReportType } from "../types/reports";
import { getReport } from "../Pages/reports/reports.service";
import { dashboardQueryString } from "../Pages/Dashboard/dashboard.service";
import { useRangeFilters } from "./useRangeFilters";

/** Loads one report on mount and whenever the tab or a filter changes; no polling (it's an on-demand report). */
export const useReports = () => {
    const filters = useRangeFilters();
    const [type, setType] = useState<ReportType>("sales");
    const [report, setReport] = useState<(Report<unknown> & { type: ReportType }) | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const { query } = filters;
    const key = `${type}|${dashboardQueryString(query)}`;

    const load = useCallback(
        async (signal?: AbortSignal) => {
            setLoading(true);
            try {
                setReport({ type, ...(await getReport(type, query, signal)) });
                setError("");
            } catch (e) {
                if (!signal?.aborted) setError(e instanceof Error ? e.message : "Couldn't load the report");
            } finally {
                if (!signal?.aborted) setLoading(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` already covers type and query
        [key],
    );

    useEffect(() => {
        const ctrl = new AbortController();
        load(ctrl.signal);
        return () => ctrl.abort();
    }, [load]);

    // A report fetched for another tab must never render under this tab's columns; other filter changes just dim the old rows until the new ones land
    const current = report?.type === type ? report : null;

    return { ...filters, type, setType, report: current, error, loading, refresh: () => load() };
};
