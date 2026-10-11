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

    const onAddArea = () => {
        const name = window.prompt("New area name")?.trim();
        if (name) run(() => createArea(name));
    };
    const onEdit = (a: DeliveryArea) => {
        const name = window.prompt("Rename area", a.area_name)?.trim();
        if (name && name !== a.area_name) run(() => renameArea(a.area_id, name));
    };
    const onDelete = (a: DeliveryArea) => {
        if (window.confirm(`Delete "${a.area_name}"?`)) run(() => deleteArea(a.area_id));
    };

    return { areas, error, onAddArea, onEdit, onDelete };
};
