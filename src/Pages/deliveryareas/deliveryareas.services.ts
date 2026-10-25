import { ANALYTICS_API, api, LOCATIONS_API } from "../../services/apiClient";
import type { AreaForm, AreaMetric, DeliveryArea } from "../../types/deliveryAreas";

export const listAreas = () => api<DeliveryArea[]>(LOCATIONS_API, "/areas");

export const createArea = (a: AreaForm) =>
  api<DeliveryArea>(LOCATIONS_API, "/areas", { method: "POST", body: JSON.stringify(a) });

export const updateArea = (id: DeliveryArea["area_id"], a: AreaForm) =>
  api<DeliveryArea>(LOCATIONS_API, `/areas/${id}`, { method: "PUT", body: JSON.stringify(a) });

// 409 (users still assigned) arrives as Error(message) from api()
export const deleteArea = (id: DeliveryArea["area_id"]) =>
  api<unknown>(LOCATIONS_API, `/areas/${id}`, { method: "DELETE" });

export const getAreaMetrics = () =>
  api<{ data: AreaMetric[] }>(ANALYTICS_API, "/analytics/area-metrics").then((r) => r.data);
