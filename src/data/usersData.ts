import type { UserRow } from "../types/users";

export const seedUsers: UserRow[] = [
    {
        id: "u1",
        name: "John Smith",
        email: "john.smith@email.com",
        area: "Unassigned",
        status: "pending",
        registered: "Dec 5, 2025",
    },
    {
        id: "u2",
        name: "Sarah Johnson",
        email: "sarah.j@email.com",
        area: "Unassigned",
        status: "pending",
        registered: "Dec 4, 2025",
    },
    // add more rows if you want...
];
