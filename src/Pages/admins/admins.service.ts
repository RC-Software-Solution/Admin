import { api, USER_API } from "../../services/apiClient";
import type { Admin, AdminRole } from "../../types/admins";

export const listAdmins = () => api<{ admins: Admin[] }>(USER_API, "/users/admins").then((r) => r.admins);

export const createAdmin = (a: { full_name: string; email: string; password: string; role: AdminRole }) =>
  api<{ admin: Admin }>(USER_API, "/users/admins", { method: "POST", body: JSON.stringify(a) });
