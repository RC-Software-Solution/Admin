import { useCallback, useEffect, useState } from "react";
import type { FoodItem, PriceChange } from "../types/menu";
import { createFoodItem, deleteFoodItem, getPriceHistory, listFoodItems, setFoodItemActive, updateFoodItem } from "../Pages/fooditems/fooditems.service";

export const useFoodItems = () => {
    const [rows, setRows] = useState<FoodItem[]>([]);
    const [loaded, setLoaded] = useState(false); // false until the first list arrives
    const [error, setError] = useState("");
    const [history, setHistory] = useState<PriceChange[] | null>(null); // null = history dialog closed

    const load = useCallback(() => listFoodItems().then((r) => { setRows(r); setLoaded(true); }), []);

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
        add: (f: Parameters<typeof createFoodItem>[0]) => run(() => createFoodItem(f)),
        edit: (id: number, f: Parameters<typeof updateFoodItem>[1]) => run(() => updateFoodItem(id, f)),
        setActive: (id: number, active: boolean) => run(() => setFoodItemActive(id, active)),
        remove: (id: number) => run(() => deleteFoodItem(id)),
        history, closeHistory: () => setHistory(null),
        viewHistory: (id: number) => getPriceHistory(id).then(setHistory, (e: Error) => setError(e.message)),
    };
};
