import { ANALYTICS_API, api } from "./apiClient";
import type { Attention } from "../types/attention";

export const getAttention = (signal?: AbortSignal) => api<Attention>(ANALYTICS_API, "/analytics/attention", { signal });
