import { ANALYTICS_API, api } from "../../services/apiClient";
import type { DashboardData } from "../../types/dashboard";

export const getDashboard = (signal?: AbortSignal) => api<DashboardData>(ANALYTICS_API, "/analytics/dashboard", { signal });
