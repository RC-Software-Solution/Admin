import { useState } from "react";
import type { MealType } from "../types/dashboard";
import { getDashboard } from "../Pages/Dashboard/dashboard.service";
import { usePolling } from "./usePolling";

const POLL_MS = 30_000;

export const useDashboard = () => {
    const [activeTab, setActiveTab] = useState<MealType>("breakfast");
    const { data, error, updatedAt, refresh } = usePolling(getDashboard, POLL_MS);

    return { data, error, updatedAt, refresh, activeTab, setActiveTab, tabs: ["breakfast", "lunch", "dinner"] as MealType[] };
};
