import { ANALYTICS_API, api } from "../../services/apiClient";
import type { DashboardData, DashboardQuery } from "../../types/dashboard";

export const dashboardQueryString = (q: DashboardQuery) => {
  const p = new URLSearchParams({ from: q.from, to: q.to });
  if (q.areaId) p.set("area_id", q.areaId);
  if (q.session) p.set("session", q.session);
  return p.toString();
};

export const getDashboard = (q: DashboardQuery, signal?: AbortSignal) =>
  api<DashboardData>(ANALYTICS_API, `/analytics/dashboard?${dashboardQueryString(q)}`, { signal });
