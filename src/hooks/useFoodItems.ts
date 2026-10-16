import { useCallback, useEffect, useState } from "react";
import type { FoodItem } from "../types/menu";
import { createFoodItem, deleteFoodItem, listFoodItems, updateFoodItem } from "../Pages/fooditems/fooditems.service";

export const useFoodItems = () => {
    const [rows, setRows] = useState<FoodItem[]>([]);
    const [error, setError] = useState("");

    const load = useCallback(() => listFoodItems().then(setRows), []);

    useEffect(() => {
        load().catch((e: Error) => setError(e.message));
    }, [load]);

    // Run a mutation, then reload. Resolves true on success so a modal knows to close; failures show in `error`
    const run = (fn: () => Promise<unknown>) =>
        fn().then(load).then(
            () => { setError(""); return true; },
            (e: Error) => { setError(e.message); return false; },
        );

    return {
        rows, error, clearError: () => setError(""),
        add: (f: Parameters<typeof createFoodItem>[0]) => run(() => createFoodItem(f)),
        edit: (id: number, f: Parameters<typeof updateFoodItem>[1]) => run(() => updateFoodItem(id, f)),
        remove: (id: number) => run(() => deleteFoodItem(id)),
    };
};
