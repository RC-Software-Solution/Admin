import { useCallback, useEffect, useState } from "react";
import type { AreaForm, AreaMetric, DeliveryArea } from "../types/deliveryAreas";
import { createArea, deleteArea, getAreaMetrics, listAreas, updateArea } from "../Pages/deliveryareas/deliveryareas.services";

export const useDeliveryAreas = () => {
    const [areas, setAreas] = useState<DeliveryArea[]>([]);
    const [metrics, setMetrics] = useState<AreaMetric[] | null>(null); // null = analytics unavailable
    const [error, setError] = useState("");

    const load = useCallback(
        () => Promise.all([listAreas().then(setAreas), getAreaMetrics().then(setMetrics, () => setMetrics(null))]),
        [],
    );

    // Run a mutation, then reload. Resolves true on success so a modal knows to close.
    const run = (fn: () => Promise<unknown>) =>
        fn().then(load).then(
            () => { setError(""); return true; },
            (e: Error) => { setError(e.message); return false; },
        );

    useEffect(() => {
        load().catch((e: Error) => setError(e.message));
    }, [load]);

    const metricOf = (a: DeliveryArea) => metrics?.find((m) => String(m.area_id) === String(a.area_id));

    return {
        areas, error, metricsAvailable: metrics !== null, metricOf,
        onSave: (a: DeliveryArea | undefined, f: AreaForm) => run(() => (a ? updateArea(a.area_id, f) : createArea(f))),
        onDelete: (a: DeliveryArea) => run(() => deleteArea(a.area_id)),
    };
};
