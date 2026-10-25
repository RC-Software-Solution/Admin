import { useEffect, useMemo, useState } from "react";
import type { Customer } from "../types/users";
import type { Order } from "../types/orders";
import { listCustomers } from "../Pages/Users/users.service";
import { searchOrders } from "../Pages/orders/orders.service";

const MIN_CHARS = 2;
const MAX_EACH = 5;

/**
 * Top-bar search: customers by name, email or phone (filtered in the browser from one list fetched on first use)
 * and orders by id prefix (asked of order-service after a short pause).
 */
export const useGlobalSearch = (text: string, active: boolean) => {
    const q = text.trim();
    const [customers, setCustomers] = useState<Customer[] | null>(null);
    const [found, setFound] = useState<{ q: string; orders: Order[] } | null>(null);
    const [error, setError] = useState("");

    // Fetch the customer list once, the first time the box is used
    useEffect(() => {
        if (!active || customers) return;
        listCustomers().then(setCustomers, (e: Error) => setError(e.message));
    }, [active, customers]);

    useEffect(() => {
        if (q.length < MIN_CHARS) return;
        const ctrl = new AbortController();
        const timer = setTimeout(() => {
            searchOrders(q, ctrl.signal).then(
                (orders) => setFound({ q, orders: orders.slice(0, MAX_EACH) }),
                (e: Error) => { if (!ctrl.signal.aborted) setError(e.message); },
            );
        }, 250);
        return () => { clearTimeout(timer); ctrl.abort(); };
    }, [q]);

    const lower = q.toLowerCase();
    const matchedCustomers = useMemo(
        () => (q.length < MIN_CHARS || !customers ? [] : customers
            .filter((c) => c.full_name.toLowerCase().includes(lower) || c.email.toLowerCase().includes(lower) || (c.phone ?? "").includes(q))
            .slice(0, MAX_EACH)),
        [customers, lower, q],
    );

    const ready = q.length >= MIN_CHARS;
    return {
        ready,
        customers: matchedCustomers,
        orders: ready && found?.q === q ? found.orders : [], // never show orders found for an earlier text
        settled: ready && found?.q === q && customers !== null,
        error,
    };
};
