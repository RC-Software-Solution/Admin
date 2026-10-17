import { USER_API, api } from "../../services/apiClient";
import type { AuditPage, AuditQuery } from "../../types/auditLogs";

export const auditKey = (q: AuditQuery) => {
  const p = new URLSearchParams({ from: q.from, to: q.to, page: String(q.page) });
  if (q.group) p.set("group", q.group);
  return p.toString();
};

export const listAuditLogs = (q: AuditQuery, signal?: AbortSignal) => api<AuditPage>(USER_API, `/users/audit-logs?${auditKey(q)}`, { signal });
