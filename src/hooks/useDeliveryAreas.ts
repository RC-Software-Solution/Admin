import { useCallback, useEffect, useState } from "react";
import type { DeliveryArea } from "../types/deliveryAreas";
import { createArea, deleteArea, listAreas, renameArea } from "../Pages/deliveryareas/deliveryareas.services";

export const useDeliveryAreas = () => {
    const [areas, setAreas] = useState<DeliveryArea[]>([]);
    const [error, setError] = useState("");

    const load = useCallback(() => listAreas().then(setAreas), []);

    // Run a mutation, then reload; surface any failure in `error`
    const run = (fn: () => Promise<unknown>) =>
        fn().then(load).then(() => setError(""), (e: Error) => setError(e.message));

    useEffect(() => {
        load().catch((e: Error) => setError(e.message));
    }, [load]);

    const onAdd = (name: string) => run(() => createArea(name));
    const onRename = (a: DeliveryArea, name: string) => run(() => renameArea(a.area_id, name));
    const onDelete = (a: DeliveryArea) => run(() => deleteArea(a.area_id));

    return { areas, error, onAdd, onRename, onDelete };
};
