import { useMemo, useState } from "react";
import type { UserStatus, UserRow, UserTab } from "../types/users";
import { seedUsers } from "../data/usersData";

const TABS: UserTab[] = [
    { key: "pending", label: "Pending" },
    { key: "accepted", label: "Accepted" },
    { key: "rejected", label: "Rejected" },
    { key: "suspended", label: "Suspended" },
    { key: "blocked", label: "Blocked" },
];

export const useUsers = () => {
    const [activeTab, setActiveTab] = useState<UserStatus>("pending");
    const [query, setQuery] = useState("");
    const [rows, setRows] = useState<UserRow[]>(seedUsers);

    const counts = useMemo(() => {
        const c: Record<UserStatus, number> = {
            pending: 0,
            accepted: 0,
            rejected: 0,
            suspended: 0,
            blocked: 0,
        };
        rows.forEach((r) => (c[r.status] += 1));
        return c;
    }, [rows]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rows
            .filter((r) => r.status === activeTab)
            .filter((r) => {
                if (!q) return true;
                return (
                    r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
                );
            });
    }, [rows, activeTab, query]);

    const onApprove = (id: string) => {
        setRows((prev) =>
            prev.map((u) => (u.id === id ? { ...u, status: "accepted" } : u))
        );
    };

    const onReject = (id: string) => {
        setRows((prev) =>
            prev.map((u) => (u.id === id ? { ...u, status: "rejected" } : u))
        );
    };

    return {
        activeTab,
        setActiveTab,
        query,
        setQuery,
        counts,
        filtered,
        onApprove,
        onReject,
        tabs: TABS
    };
};
