import { useCallback, useEffect, useState } from "react";
import type { Admin } from "../types/admins";
import { createAdmin, listAdmins } from "../Pages/admins/admins.service";

type NewAdmin = Parameters<typeof createAdmin>[0];

export const useAdmins = () => {
    const [rows, setRows] = useState<Admin[]>([]);
    const [error, setError] = useState("");

    const load = useCallback(() => listAdmins().then(setRows), []);

    useEffect(() => {
        load().catch((e: Error) => setError(e.message));
    }, [load]);

    // Resolves true on success so the form knows to close; failures show in `error`
    const add = (a: NewAdmin) =>
        createAdmin(a).then(load).then(
            () => { setError(""); return true; },
            (e: Error) => { setError(e.message); return false; },
        );

    return { rows, error, add };
};
