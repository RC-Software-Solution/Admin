import { useCallback, useEffect, useState } from "react";
import type { DeliveryArea } from "../types/deliveryAreas";
import type { Order, OrderFilters, OrderStatus, PaymentStatus } from "../types/orders";
import { listAreas } from "../Pages/deliveryareas/deliveryareas.services";
import { listOrders, PAGE_SIZE, updateOrderStatus, updatePaymentStatus } from "../Pages/orders/orders.service";
import { usePolling } from "./usePolling";

const EMPTY: OrderFilters = { status: "", payment_status: "", area_id: "", from: "", to: "" };

export const useOrders = () => {
    const [filters, setFilters] = useState<OrderFilters>(EMPTY);
    const [page, setPage] = useState(0);
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
        page, setPage, filters, setFilter, areas, areaName, updatedAt, refresh,
        error: actionError || error,
        setStatus: (o: Order, status: OrderStatus, reason?: string) => run(() => updateOrderStatus(o.id, status, reason)),
        setPayment: (o: Order, p: PaymentStatus) => run(() => updatePaymentStatus(o.id, p)),
    };
};
