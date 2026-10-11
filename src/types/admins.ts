export type AdminRole = "admin" | "super_admin";

export interface Admin {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    role: AdminRole;
    status: "active" | "inactive";
    created_at: string;
}
