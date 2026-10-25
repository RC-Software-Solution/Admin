import { ANALYTICS_API, api } from "../../services/apiClient";
import { dashboardQueryString } from "../Dashboard/dashboard.service";
import type { DashboardQuery } from "../../types/dashboard";
import type { Report, ReportType } from "../../types/reports";

export const getReport = <T>(type: ReportType, q: DashboardQuery, signal?: AbortSignal) =>
  api<Report<T>>(ANALYTICS_API, `/analytics/reports/${type}?${dashboardQueryString(q)}`, { signal });

/** RFC 4180 quoting; cells starting with = + - @ get a leading ' so a spreadsheet can't run an item name as a formula. */
const cell = (v: string | number) => {
  const s = String(v);
  const safe = typeof v === "string" && /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** Saves rows as a CSV file (BOM so Excel reads UTF-8). */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const text = [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿", text], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}
