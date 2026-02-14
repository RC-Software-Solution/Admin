import type { SessionTab, SessionRowData, TopItemData, AreaRow } from "../types/dashboard";

export const sessionData: Record<SessionTab, SessionRowData[]> = {
    Breakfast: [
        { date: "Dec 7, 2025", orders: 45, amount: "$1250", status: "completed" },
        { date: "Dec 6, 2025", orders: 38, amount: "$1100", status: "completed" },
    ],
    Lunch: [
        { date: "Dec 7, 2025", orders: 62, amount: "$1650", status: "completed" },
        { date: "Dec 6, 2025", orders: 50, amount: "$1410", status: "completed" },
    ],
    Dinner: [
        { date: "Dec 7, 2025", orders: 40, amount: "$1320", status: "completed" },
        { date: "Dec 6, 2025", orders: 29, amount: "$980", status: "completed" },
    ],
};

export const topItems: TopItemData[] = [
    { img: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&q=80", name: "Grilled Chicken Sandwich", price: "$12.99", sold: 145 },
    { img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&q=80", name: "Caesar Salad", price: "$9.99", sold: 132 },
    { img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80", name: "Margherita Pizza", price: "$14.99", sold: 118 },
    { img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80", name: "Beef Burger", price: "$11.99", sold: 104 },
];

export const areaRows: AreaRow[] = [
    { area: "Downtown", orders: 234, revenue: "$6780", rate: 96 },
    { area: "Westside", orders: 189, revenue: "$5340", rate: 94 },
    { area: "Eastside", orders: 167, revenue: "$4920", rate: 92 },
    { area: "Northside", orders: 145, revenue: "$4120", rate: 95 },
];
