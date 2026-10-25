import { api, USER_API } from "../../services/apiClient";
import type { Customer, CustomerProfile } from "../../types/users";

const BASE = "/users/customers";
const put = (id: string, action: string) => api<unknown>(USER_API, `${BASE}/${id}/${action}`, { method: "PUT" });
const post = (id: string, action: string, body: object) =>
  api<unknown>(USER_API, `${BASE}/${id}/${action}`, { method: "POST", body: JSON.stringify(body) });

export const listCustomers = () => api<Customer[]>(USER_API, BASE);
export const getProfile = (id: string) => api<CustomerProfile>(USER_API, `${BASE}/${id}/profile`);

export const approveCustomer = (id: string, area_id: Customer["area_id"]) => post(id, "approve", { area_id });
export const rejectCustomer = (id: string, reason: string) => post(id, "reject", { reason });
export const disableCustomer = (id: string) => put(id, "disable");
export const enableCustomer = (id: string) => put(id, "enable");
export const unlockCustomer = (id: string) => put(id, "unlock");

/** /export returns JSON, so the CSV is built here. */
export async function exportCsv(status?: string): Promise<string> {
  const { customers } = await api<{ customers: Record<string, unknown>[] }>(USER_API, `${BASE}/export${status ? `?status=${status}` : ""}`);
  if (!customers.length) return "";
  const cols = Object.keys(customers[0]);
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...customers.map((c) => cols.map((k) => cell(c[k])).join(","))].join("\n");
}
