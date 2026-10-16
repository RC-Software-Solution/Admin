import { useEffect, useState } from "react";
import type { DashboardQuery, MealType } from "../types/dashboard";
import type { DeliveryArea } from "../types/deliveryAreas";
import { listAreas } from "../Pages/deliveryareas/deliveryareas.services";
import { dashboardQueryString, getDashboard } from "../Pages/Dashboard/dashboard.service";
import { addDays, colomboToday } from "../utils/formatDate";
import { usePolling } from "./usePolling";

const POLL_MS = 30_000;

export type Preset = "today" | "7d" | "30d" | "custom";

export const useDashboard = () => {
    const [activeTab, setActiveTab] = useState<MealType>("breakfast");
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

    const { data, error, updatedAt, refresh } = usePolling((signal) => getDashboard(query, signal), POLL_MS, dashboardQueryString(query));

    // The filters changed and the matching response has not arrived yet: the old numbers are shown dimmed
    const loading =
        !!data && (data.range.from !== query.from || data.range.to !== query.to || (data.range.areaId ?? "") !== areaId || (data.range.session ?? "") !== session);

    return {
        data, error, updatedAt, refresh, loading,
        activeTab, setActiveTab, tabs: ["breakfast", "lunch", "dinner"] as MealType[],
        preset, setPreset, custom, setCustom, range, areaId, setAreaId, session, setSession, areas,
    };
};
