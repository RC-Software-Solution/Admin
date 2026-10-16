import { useCallback, useEffect, useState } from "react";
import type { DeliveryPerson } from "../types/deliveryPersons";
import type { DeliveryArea } from "../types/deliveryAreas";
import { listAreas } from "../Pages/deliveryareas/deliveryareas.services";
import {
    createDeliveryPerson, listDeliveryPersons, resetDeliveryPersonPassword, setDeliveryPersonActive, updateDeliveryPerson,
} from "../Pages/deliverypersons/deliverypersons.service";

export const useDeliveryPersons = () => {
    const [rows, setRows] = useState<DeliveryPerson[]>([]);
    const [areas, setAreas] = useState<DeliveryArea[]>([]);
    const [error, setError] = useState("");

    const load = useCallback(() => listDeliveryPersons().then(setRows), []);

    useEffect(() => {
        Promise.all([load(), listAreas().then(setAreas)]).catch((e: Error) => setError(e.message));
    }, [load]);

    // Run a mutation, then reload. Resolves true on success so a modal knows to close; failures show in `error`
    const run = (fn: () => Promise<unknown>) =>
        fn().then(load).then(
            () => { setError(""); return true; },
            (e: Error) => { setError(e.message); return false; },
        );

    return {
        rows, areas, error, clearError: () => setError(""),
        add: (d: Parameters<typeof createDeliveryPerson>[0]) => run(() => createDeliveryPerson(d)),
        edit: (id: string, d: Parameters<typeof updateDeliveryPerson>[1]) => run(() => updateDeliveryPerson(id, d)),
        setActive: (id: string, active: boolean) => run(() => setDeliveryPersonActive(id, active)),
        resetPassword: (id: string, password: string) => run(() => resetDeliveryPersonPassword(id, password)),
    };
};
