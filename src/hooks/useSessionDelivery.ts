import { useEffect, useState } from "react";
import type { DeliveryArea } from "../types/deliveryAreas";
import type { DeliveryPerson } from "../types/deliveryPersons";
import { listAreas } from "../Pages/deliveryareas/deliveryareas.services";
import { listDeliveryPersons } from "../Pages/deliverypersons/deliverypersons.service";
import { getSessionDelivery, setSessionDelivery } from "../Pages/sessions/sessions.service";

/** Delivery assignments of one session: every area gets at most one active driver. choice maps area_id -> user_id ("" = nobody). */
export const useSessionDelivery = (sessionId: number) => {
    const [areas, setAreas] = useState<DeliveryArea[]>([]);
    const [drivers, setDrivers] = useState<DeliveryPerson[]>([]);
    const [choice, setChoice] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([listAreas(), listDeliveryPersons(), getSessionDelivery(sessionId)])
            .then(([a, d, assigned]) => {
                setAreas(a);
                setDrivers(d.filter((p) => p.status === "active"));
                setChoice(Object.fromEntries(assigned.map((x) => [x.area_id, x.user_id])));
            })
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    }, [sessionId]);

    /** Resolves true when saved so the dialog can close. */
    const save = () =>
        setSessionDelivery(
            sessionId,
            Object.entries(choice).filter(([, user]) => user).map(([area, user_id]) => ({ area_id: Number(area), user_id })),
        ).then(
            () => true,
            (e: Error) => { setError(e.message); return false; },
        );

    return { areas, drivers, choice, loading, error, save, assign: (areaId: number, userId: string) => setChoice((c) => ({ ...c, [areaId]: userId })) };
};
