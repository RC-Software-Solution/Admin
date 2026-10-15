import { api, USER_API } from "../../services/apiClient";
import type { Admin, AdminRole } from "../../types/admins";

export const listAdmins = () => api<{ admins: Admin[] }>(USER_API, "/users/admins").then((r) => r.admins);

export const createAdmin = (a: { full_name: string; email: string; password: string; role: AdminRole }) =>
  api<{ admin: Admin }>(USER_API, "/users/admins", { method: "POST", body: JSON.stringify(a) });

const BASE = "/users/admins";

export const updateAdmin = (id: string, a: { full_name: string; role: AdminRole }) =>
  api<{ admin: Admin }>(USER_API, `${BASE}/${id}`, { method: "PUT", body: JSON.stringify(a) });

export const setAdminActive = (id: string, active: boolean) =>
  api<{ admin: Admin }>(USER_API, `${BASE}/${id}/${active ? "enable" : "disable"}`, { method: "PUT" });

export const resetAdminPassword = (id: string, password: string) =>
  api<unknown>(USER_API, `${BASE}/${id}/reset-password`, { method: "POST", body: JSON.stringify({ password }) });
