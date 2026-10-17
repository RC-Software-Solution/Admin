import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { DeliveryArea } from "../types/deliveryAreas";
import type { Order, OrderFilters, OrderStatus, PaymentStatus } from "../types/orders";
import { listAreas } from "../Pages/deliveryareas/deliveryareas.services";
import { listOrders, notifyUnpaid, PAGE_SIZE, updateOrderStatus, updatePaymentStatus } from "../Pages/orders/orders.service";
import { usePolling } from "./usePolling";

const EMPTY: OrderFilters = { status: "", payment_status: "", area_id: "", from: "", to: "", q: "" };

const STATUSES: OrderStatus[] = ["pending", "preparing", "delivering", "delivered", "completed", "cancelled", "delivery_failed"];
const PAYMENTS: PaymentStatus[] = ["pending", "paid", "unpaid", "ignored"];

/** Filters named in the URL (linked from the top-bar bell and search); anything unrecognised is ignored. */
const fromUrl = (p: URLSearchParams): Partial<OrderFilters> => ({
    ...(STATUSES.includes(p.get("status") as OrderStatus) && { status: p.get("status") as OrderStatus }),
    ...(PAYMENTS.includes(p.get("payment_status") as PaymentStatus) && { payment_status: p.get("payment_status") as PaymentStatus }),
    ...(p.get("q") && { q: p.get("q") as string }),
});

export const useOrders = () => {
    const [params] = useSearchParams();
    const urlKey = params.toString();
    const [filters, setFilters] = useState<OrderFilters>({ ...EMPTY, ...fromUrl(params) });
    const [page, setPage] = useState(0);
    // Customers ticked for a payment reminder (by customer id, so all of a customer's rows tick together)
    const [selected, setSelected] = useState<string[]>([]);
    const [reminderResult, setReminderResult] = useState("");
    // The page stays mounted when a link only changes the query string, so follow it when it changes
    const [seenUrl, setSeenUrl] = useState(urlKey);
    if (seenUrl !== urlKey) {
        setSeenUrl(urlKey);
        setFilters({ ...EMPTY, ...fromUrl(params) });
        setPage(0);
        setSelected([]);
    }
    const [areas, setAreas] = useState<DeliveryArea[]>([]);
    const [actionError, setActionError] = useState("");

    const { data, error, updatedAt, refresh } = usePolling<Order[]>((signal) => listOrders(filters, page, signal));

    // usePolling only fetches on its timer; a filter or page change should show up immediately
    const key = JSON.stringify([filters, page]);
    useEffect(() => {
        refresh();
    }, [key, refresh]);

    useEffect(() => {
        listAreas().then(setAreas).catch(() => {}); // area names are a nicety; the list works without them
    }, []);

    const setFilter = useCallback(<K extends keyof OrderFilters>(k: K, v: OrderFilters[K]) => {
        setFilters((f) => ({ ...f, [k]: v }));
        setPage(0);
        setSelected([]);
    }, []);

    // Run a mutation, then refresh. Resolves true on success so a modal knows to close.
    const run = (fn: () => Promise<unknown>) =>
        fn().then(refresh).then(
            () => { setActionError(""); return true; },
            (e: Error) => { setActionError(e.message); return false; },
        );

    const areaName = (id: Order["area_id"]) =>
        id == null ? "—" : areas.find((a) => String(a.area_id) === String(id))?.area_name ?? `#${id}`;

    return {
        orders: data?.slice(0, PAGE_SIZE) ?? [],
        loaded: data !== null,
        hasNext: (data?.length ?? 0) > PAGE_SIZE,
        page, setPage: (p: number) => { setPage(p); setSelected([]); }, filters, setFilter, areas, areaName, updatedAt, refresh,
        selected,
        toggleCustomer: (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
        selectPage: (all: boolean) => setSelected(all ? [...new Set(data?.slice(0, PAGE_SIZE).map((o) => o.customer_id) ?? [])] : []),
        reminderResult,
        sendReminders: async () => {
            try {
                const r = await notifyUnpaid(selected);
                const parts = [`Reminder sent to ${r.sent} customer${r.sent === 1 ? "" : "s"}`];
                if (r.no_device) parts.push(`${r.no_device} ha${r.no_device === 1 ? "s" : "ve"} no device registered`);
                if (r.nothing_unpaid) parts.push(`${r.nothing_unpaid} had nothing unpaid`);
                if (r.failed) parts.push(`${r.failed} failed`);
                setReminderResult(parts.join(", ") + ".");
                setActionError("");
                setSelected([]);
            } catch (e) {
                setActionError(e instanceof Error ? e.message : "Could not send the reminders");
            }
        },
        dismissReminderResult: () => setReminderResult(""),
        error: actionError || error,
        setStatus: (o: Order, status: OrderStatus, reason?: string) => run(() => updateOrderStatus(o.id, status, reason)),
        setPayment: (o: Order, p: PaymentStatus) => run(() => updatePaymentStatus(o.id, p)),
    };
};
