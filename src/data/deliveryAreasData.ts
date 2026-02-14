import type { DeliveryArea } from "../types/deliveryAreas";

export const areasMock: DeliveryArea[] = [
    { id: "1", name: "Downtown", code: "DT", status: "active", ordersToday: 234, assignedUsers: 342, deliveryFee: 5.0 },
    { id: "2", name: "Westside", code: "WS", status: "active", ordersToday: 189, assignedUsers: 267, deliveryFee: 6.0 },
    { id: "3", name: "Eastside", code: "ES", status: "active", ordersToday: 167, assignedUsers: 198, deliveryFee: 6.0 },
    { id: "4", name: "Northside", code: "NS", status: "active", ordersToday: 145, assignedUsers: 156, deliveryFee: 7.0 },
];
