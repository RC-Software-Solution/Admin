import { useCallback, useEffect, useMemo, useState } from "react";
import type { Customer, CustomerProfile, UserStatus, UserTab } from "../types/users";
import { statusOf } from "../types/users";
import type { DeliveryArea } from "../types/deliveryAreas";
import { listAreas } from "../Pages/deliveryareas/deliveryareas.services";
import * as svc from "../Pages/Users/users.service";

const TABS: UserTab[] = [
    { key: "pending", label: "Pending" },
    { key: "accepted", label: "Accepted" },
    { key: "rejected", label: "Rejected" },
    { key: "disabled", label: "Disabled" },
    { key: "blocked", label: "Blocked" },
];

export const useUsers = () => {
    const [activeTab, setActiveTab] = useState<UserStatus>("pending");
    const [query, setQuery] = useState("");
    const [rows, setRows] = useState<Customer[]>([]);
    const [areas, setAreas] = useState<DeliveryArea[]>([]);
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [error, setError] = useState("");

    // One fetch of every customer; tabs and counts are derived client-side
    const load = useCallback(() => svc.listCustomers().then(setRows), []);

    useEffect(() => {
        load().catch((e: Error) => setError(e.message));
        listAreas().then(setAreas).catch((e: Error) => setError(e.message));
    }, [load]);

    const counts = useMemo(() => {
        const c = { pending: 0, accepted: 0, rejected: 0, disabled: 0, blocked: 0 };
        rows.forEach((r) => (c[statusOf(r)] += 1));
        return c;
    }, [rows]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rows.filter(
            (r) =>
                statusOf(r) === activeTab &&
                (!q || r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)),
        );
    }, [rows, activeTab, query]);

    const areaName = (id: Customer["area_id"]) =>
        id == null ? "—" : areas.find((a) => String(a.area_id) === String(id))?.area_name ?? `#${id}`;

    // Run a mutation, then reload; resolves true on success so a modal knows to close
    const run = (fn: () => Promise<unknown>) =>
        fn().then(load).then(
            () => { setError(""); return true; },
            (e: Error) => { setError(e.message); return false; },
        );

    const openProfile = (id: string) =>
        svc.getProfile(id).then(setProfile, (e: Error) => setError(e.message));

    const exportCsv = () =>
        svc.exportCsv(activeTab).then((csv) => {
            if (!csv) return setError("Nothing to export for this tab");
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
            a.download = `customers-${activeTab}.csv`;
            a.click();
            URL.revokeObjectURL(a.href);
        }, (e: Error) => setError(e.message));

    return {
        activeTab, setActiveTab, query, setQuery, counts, filtered, areas, areaName, error,
        profile, openProfile, closeProfile: () => setProfile(null), exportCsv,
        approve: (c: Customer, areaId: string) => run(() => svc.approveCustomer(c.id, areaId)),
        reject: (c: Customer, reason: string) => run(() => svc.rejectCustomer(c.id, reason)),
        disable: (c: Customer) => run(() => svc.disableCustomer(c.id)),
        enable: (c: Customer) => run(() => svc.enableCustomer(c.id)),
        unlock: (c: Customer) => run(() => svc.unlockCustomer(c.id)),
        tabs: TABS,
    };
};
