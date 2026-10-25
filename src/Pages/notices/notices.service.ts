import { api, LOCATIONS_API, USER_API } from "../../services/apiClient";

export interface Notice {
  id: number | string;
  title: string;
  body: string;
  area_id: number | string | null;
  createdAt: string;
}

export interface Area {
  area_id: number;
  area_name: string;
}

export const listNotices = () =>
  api<{ notices: Notice[] }>(USER_API, "/users/notices?limit=100").then((r) => r.notices);

export const listAreas = () => api<Area[]>(LOCATIONS_API, "/areas");

export const createNotice = (n: { title: string; body: string; area_id: number | null }) =>
  api<{ notice: Notice; push: { sent: number; failed: number } }>(USER_API, "/users/notices", {
    method: "POST",
    body: JSON.stringify(n),
  });

export const deleteNotice = (id: Notice["id"]) => api<unknown>(USER_API, `/users/notices/${id}`, { method: "DELETE" });
