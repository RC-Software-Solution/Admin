import { useState } from "react";
import type { Admin } from "../types/admins";
import { ADMINS } from "../data/adminsData";

export const useAdmins = () => {
    const [rows, setRows] = useState<Admin[]>(ADMINS);

    const toggleStatus = (id: string) => {
        setRows((prev) =>
            prev.map((a) =>
                a.id === id
                    ? { ...a, status: a.status === "active" ? "suspended" : "active" }
                    : a
            )
        );
    };

    const onEdit = (admin: Admin) => {
        alert(`Edit: ${admin.name}`);
    };

    const onAddAdmin = () => {
        alert("Add Admin");
    };

    return {
        rows,
        toggleStatus,
        onEdit,
        onAddAdmin
    };
};
