import { api, LOCATIONS_API } from "../../services/apiClient";
import type { DeliveryArea } from "../../types/deliveryAreas";

// locations-service only stores area_id + area_name; fee/status/order counts aren't in the backend.
export const listAreas = () => api<DeliveryArea[]>(LOCATIONS_API, "/areas");

export const createArea = (area_name: string) =>
  api<DeliveryArea>(LOCATIONS_API, "/areas", { method: "POST", body: JSON.stringify({ area_name }) });

export const renameArea = (id: DeliveryArea["area_id"], area_name: string) =>
  api<DeliveryArea>(LOCATIONS_API, `/areas/${id}`, { method: "PUT", body: JSON.stringify({ area_name }) });

export const deleteArea = (id: DeliveryArea["area_id"]) =>
  api<unknown>(LOCATIONS_API, `/areas/${id}`, { method: "DELETE" });
