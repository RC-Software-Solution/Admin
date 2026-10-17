import React from "react";
import "../Dashboard/dashboard.css";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { formatDateTime } from "../../utils/formatDate";
import { AUDIT_GROUPS } from "../../types/auditLogs";

const words = (s: string) => s.replace(/[._]/g, " ");
const show = (v: unknown) => (typeof v === "object" ? JSON.stringify(v) : String(v));

const AuditLogs: React.FC = () => {
  const a = useAuditLogs();
  const { filters, data } = a;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="content">
      <h1 className="pageTitle">Audit Logs</h1>
      <div className="pageSub">Who changed what. Customer approvals and blocks are in each customer profile.</div>

      <div className="filters">
        <input type="date" aria-label="From" value={filters.from} max={filters.to} onChange={(e) => e.target.value && a.setFilter({ from: e.target.value })} />
        <input type="date" aria-label="To" value={filters.to} min={filters.from} onChange={(e) => e.target.value && a.setFilter({ to: e.target.value })} />
        <select aria-label="Type" value={filters.group} onChange={(e) => a.setFilter({ group: e.target.value })}>
          <option value="">All actions</option>
          {AUDIT_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>
        {data && <span className="filters__range">{data.total} {data.total === 1 ? "entry" : "entries"}</span>}
      </div>

      {a.error && <div className="sectionNote">{data ? `Showing the last loaded page (refresh failed: ${a.error})` : `Couldn't load the audit log: ${a.error}`}</div>}

      <section className="card">
        <div className={`tableWrap ${a.loading ? "dim" : ""}`}>
          {!data && !a.error && <div className="sectionNote">Loading…</div>}
          {data && (
            <table className="table">
              <thead>
                <tr><th>When</th><th>Who</th><th>Action</th><th>Target</th><th>Details</th></tr>
              </thead>
              <tbody>
                {data.rows.length === 0 && <tr><td colSpan={5} className="sectionNote">Nothing recorded in this range</td></tr>}
                {data.rows.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDateTime(r.created_at)}</td>
                    <td>{r.actor_name ?? "Unknown"}{r.actor_role ? ` (${words(r.actor_role)})` : ""}</td>
                    <td>{words(r.action)}</td>
                    <td>{words(r.target_type)}{r.target_id ? ` ${r.target_id.slice(0, 8)}` : ""}</td>
                    <td>{r.details ? Object.entries(r.details).map(([k, v]) => `${words(k)}: ${show(v)}`).join(", ") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {data && pages > 1 && (
        <div className="filters">
          <button disabled={a.page <= 1} onClick={() => a.setPage(a.page - 1)}>Previous</button>
          <span className="filters__range">Page {a.page} of {pages}</span>
          <button disabled={a.page >= pages} onClick={() => a.setPage(a.page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
