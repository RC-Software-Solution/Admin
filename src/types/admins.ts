export type AdminStatus = "active" | "suspended";
export type AdminRole = "Super Admin" | "Admin";

export interface Admin {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
    status: AdminStatus;
    createdDate: string;
}
