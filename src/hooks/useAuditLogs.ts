import { useEffect, useState } from "react";
import type { AuditPage, AuditQuery } from "../types/auditLogs";
import { auditKey, listAuditLogs } from "../Pages/auditlogs/auditlogs.service";
import { addDays, colomboToday } from "../utils/formatDate";

/** Loads one page of the audit log whenever a filter or the page changes. Keeps the last good rows if a load fails. */
export const useAuditLogs = () => {
    const [filters, setFilters] = useState(() => ({ from: addDays(colomboToday(), -6), to: colomboToday(), group: "" }));
    const [page, setPage] = useState(1);
    const [data, setData] = useState<AuditPage | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const query: AuditQuery = { ...filters, page };
    const key = auditKey(query);

    useEffect(() => {
        const ctrl = new AbortController();
        setLoading(true);
        listAuditLogs(query, ctrl.signal)
            .then((d) => { setData(d); setError(""); })
            .catch((e) => { if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Couldn't load the audit log"); })
            .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
        return () => ctrl.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` already covers every field of `query`
    }, [key]);

    // A new filter starts again from page 1
    const setFilter = (patch: Partial<typeof filters>) => { setFilters((f) => ({ ...f, ...patch })); setPage(1); };

    return { filters, setFilter, page, setPage, data, error, loading };
};
