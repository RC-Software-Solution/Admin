import { useCallback, useEffect, useState } from "react";
import type { MealSession } from "../types/menu";
import type { Order } from "../types/orders";
import { colomboToday } from "../utils/formatDate";
import { addItems, createSession, deleteSession, listSessionOrders, listSessions, removeItem, setItemQuantity, updateSession } from "../Pages/sessions/sessions.service";

export const useSessions = () => {
    const [date, setDate] = useState(colomboToday);
    const [rows, setRows] = useState<MealSession[]>([]);
    const [error, setError] = useState("");
    const [orders, setOrders] = useState<Order[] | null>(null); // null = orders dialog closed

    const load = useCallback(() => listSessions(date).then(setRows), [date]);

    // `stale` drops the response of a superseded date, so a slow earlier fetch can't overwrite a newer one
    useEffect(() => {
        let stale = false;
        listSessions(date).then((r) => { if (!stale) setRows(r); }, (e: Error) => { if (!stale) setError(e.message); });
        return () => { stale = true; };
    }, [date]);

    // Run a mutation, then reload. Resolves true on success so a modal knows to close; failures show in `error`
    const run = (fn: () => Promise<unknown>) =>
        fn().then(load).then(
            () => { setError(""); return true; },
            (e: Error) => { setError(e.message); return false; },
        );

    return {
        date, setDate, rows, error, orders, closeOrders: () => setOrders(null),
        viewOrders: (s: MealSession) => listSessionOrders(s).then(setOrders, (e: Error) => setError(e.message)),
        clearError: () => setError(""),
        add: (s: Parameters<typeof createSession>[0]) => run(() => createSession(s)),
        edit: (id: number, s: Parameters<typeof updateSession>[1]) => run(() => updateSession(id, s)),
        remove: (id: number) => run(() => deleteSession(id)),
        attach: (id: number, items: Parameters<typeof addItems>[1]) => run(() => addItems(id, items)),
        setQuantity: (itemId: number, q: number | null) => run(() => setItemQuantity(itemId, q)),
        detach: (itemId: number) => run(() => removeItem(itemId)),
    };
};
