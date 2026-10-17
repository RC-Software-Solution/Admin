import { useEffect, useState } from "react";
import type { DashboardQuery, MealType } from "../types/dashboard";
import type { DeliveryArea } from "../types/deliveryAreas";
import { listAreas } from "../Pages/deliveryareas/deliveryareas.services";
import { addDays, colomboToday } from "../utils/formatDate";

export type Preset = "today" | "7d" | "30d" | "custom";

/** Date range (Sri Lanka days) + area + session filters shared by the Dashboard and Reports. */
export const useRangeFilters = () => {
    const [preset, setPreset] = useState<Preset>("7d");
    const [custom, setCustom] = useState(() => ({ from: addDays(colomboToday(), -6), to: colomboToday() }));
    const [areaId, setAreaId] = useState("");
    const [session, setSession] = useState<MealType | "">("");
    const [areas, setAreas] = useState<DeliveryArea[]>([]);

    useEffect(() => {
        listAreas().then(setAreas, () => setAreas([])); // the filter just stays empty if areas can't load
    }, []);

    // Recomputed every render, so the presets roll over at midnight Sri Lanka time on their own
    const today = colomboToday();
    const range =
        preset === "custom" ? custom
        : preset === "today" ? { from: today, to: today }
        : { from: addDays(today, preset === "7d" ? -6 : -29), to: today };
    const query: DashboardQuery = { ...range, areaId, session };

    return { preset, setPreset, custom, setCustom, range, areaId, setAreaId, session, setSession, areas, query };
};
