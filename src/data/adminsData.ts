import type { Admin } from "../types/admins";

export const ADMINS: Admin[] = [
    {
        id: "1",
        name: "Admin User",
        email: "admin@fooddelivery.com",
        role: "Super Admin",
        status: "active",
        createdDate: "Jan 1, 2025",
    },
    {
        id: "2",
        name: "Jane Manager",
        email: "jane.manager@fooddelivery.com",
        role: "Admin",
        status: "active",
        createdDate: "Feb 15, 2025",
    },
    {
        id: "3",
        name: "Tom Supervisor",
        email: "tom.supervisor@fooddelivery.com",
        role: "Admin",
        status: "active",
        createdDate: "Mar 10, 2025",
    },
    {
        id: "4",
        name: "Alice Support",
        email: "alice.support@fooddelivery.com",
        role: "Admin",
        status: "suspended",
        createdDate: "Apr 5, 2025",
    },
];
