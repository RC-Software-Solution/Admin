import { useCallback, useEffect, useState } from "react";
import type { Admin } from "../types/admins";
import { createAdmin, listAdmins, resetAdminPassword, setAdminActive, updateAdmin } from "../Pages/admins/admins.service";

type NewAdmin = Parameters<typeof createAdmin>[0];

export const useAdmins = () => {
    const [rows, setRows] = useState<Admin[]>([]);
    const [error, setError] = useState("");
    const [loaded, setLoaded] = useState(false); // false until the first list arrives

    const load = useCallback(() => listAdmins().then((r) => { setRows(r); setLoaded(true); }), []);

    useEffect(() => {
        load().catch((e: Error) => { setError(e.message); setLoaded(true); });
    }, [load]);

    // Run a mutation, then reload. Resolves true on success so a modal knows to close; failures show in `error`
    const run = (fn: () => Promise<unknown>) =>
        fn().then(load).then(
            () => { setError(""); return true; },
            (e: Error) => { setError(e.message); return false; },
        );

    return {
        rows, loaded, error, clearError: () => setError(""),
        add: (a: NewAdmin) => run(() => createAdmin(a)),
        edit: (id: string, a: Parameters<typeof updateAdmin>[1]) => run(() => updateAdmin(id, a)),
        setActive: (id: string, active: boolean) => run(() => setAdminActive(id, active)),
        resetPassword: (id: string, password: string) => run(() => resetAdminPassword(id, password)),
    };
};
