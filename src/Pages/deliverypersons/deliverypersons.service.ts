import { api, USER_API } from "../../services/apiClient";
import type { DeliveryPerson } from "../../types/deliveryPersons";

const BASE = "/users/delivery-persons";

export interface DriverForm {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  area_id: string;
}

export const listDeliveryPersons = () => api<{ deliveryPersons: DeliveryPerson[] }>(USER_API, BASE).then((r) => r.deliveryPersons);

export const createDeliveryPerson = (d: DriverForm) =>
  api<unknown>(USER_API, BASE, { method: "POST", body: JSON.stringify({ ...d, phone: d.phone || undefined }) });

export const updateDeliveryPerson = (id: string, d: Pick<DriverForm, "full_name" | "phone" | "area_id">) =>
  api<unknown>(USER_API, `${BASE}/${id}`, { method: "PUT", body: JSON.stringify(d) });

export const setDeliveryPersonActive = (id: string, active: boolean) =>
  api<unknown>(USER_API, `${BASE}/${id}/${active ? "enable" : "disable"}`, { method: "PUT" });

export const resetDeliveryPersonPassword = (id: string, password: string) =>
  api<unknown>(USER_API, `${BASE}/${id}/reset-password`, { method: "POST", body: JSON.stringify({ password }) });
