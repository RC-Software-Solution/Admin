import { useState } from "react";
import type { SessionTab } from "../types/dashboard";
import { sessionData, topItems, areaRows } from "../data/dashboardData";

export const useDashboard = () => {
    const [activeTab, setActiveTab] = useState<SessionTab>("Breakfast");

    const tabs: SessionTab[] = ["Breakfast", "Lunch", "Dinner"];

    return {
        activeTab,
        setActiveTab,
        currentSessionData: sessionData[activeTab],
        topItems,
        areaRows,
        tabs
    };
};


