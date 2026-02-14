import { useState, useMemo } from "react";
import type { DeliveryArea } from "../types/deliveryAreas";
import { areasMock } from "../data/deliveryAreasData";

export const useDeliveryAreas = () => {
    const [areas] = useState<DeliveryArea[]>(areasMock);

    // Derived state
    const stats = useMemo(() => {
        return {
            totalAreas: areas.length,
            totalUsers: areas.reduce((sum, a) => sum + a.assignedUsers, 0),
            totalOrdersToday: areas.reduce((sum, a) => sum + a.ordersToday, 0),
            activeAreas: areas.filter((a) => a.status === "active").length
        };
    }, [areas]);

    const onAddArea = () => alert("Add Area clicked");
    const onEdit = (area: DeliveryArea) => alert(`Edit: ${area.name}`);
    const onUsers = (area: DeliveryArea) => alert(`Users: ${area.name}`);

    return {
        areas,
        stats,
        onAddArea,
        onEdit,
        onUsers
    };
};
