import { Alert, Button, DataTable, FilterBar, PageHeader } from "../../components/ui";
import type { Column } from "../../components/ui";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { formatDateTime } from "../../utils/formatDate";
import { AUDIT_GROUPS } from "../../types/auditLogs";
import type { AuditRow } from "../../types/auditLogs";

const words = (s: string) => s.replace(/[._]/g, " ");
// UUIDs are shortened; order ids (ORD-...) and numeric ids are shown whole because their first characters don't tell records apart
const shortId = (id: string) => (id.length === 36 ? id.slice(0, 8) : id);
const show = (v: unknown) => (typeof v === "object" ? JSON.stringify(v) : String(v));

export default function AuditLogs() {
  const a = useAuditLogs();
  const { filters, data } = a;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  const columns: Column<AuditRow>[] = [
    { key: "when", label: "When", nowrap: true, mobile: "inline", cell: (r) => <span className="ui-cell__meta">{formatDateTime(r.created_at)}</span> },
    {
      key: "who",
      label: "Who",
      mobile: "title",
      cell: (r) => (
        <>
          <b className="ui-cell__title">{r.actor_name ?? "Unknown"}</b>
          {r.actor_role && <span className="ui-cell__meta"> {words(r.actor_role)}</span>}
        </>
      ),
    },
    { key: "action", label: "Action", cell: (r) => words(r.action) },
    { key: "target", label: "Target", cell: (r) => `${words(r.target_type)}${r.target_id ? ` ${shortId(r.target_id)}` : ""}` },
    {
      key: "details",
      label: "Details",
      cell: (r) => <span className="ui-cell__meta">{r.details ? Object.entries(r.details).map(([k, v]) => `${words(k)}: ${show(v)}`).join(", ") : "—"}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Who changed what. Customer approvals and blocks are in each customer profile." />

      <FilterBar label="Audit log filters">
        <label>
          From <input type="date" value={filters.from} max={filters.to} onChange={(e) => e.target.value && a.setFilter({ from: e.target.value })} />
        </label>
        <label>
          To <input type="date" value={filters.to} min={filters.from} onChange={(e) => e.target.value && a.setFilter({ to: e.target.value })} />
        </label>
        <select aria-label="Type" value={filters.group} onChange={(e) => a.setFilter({ group: e.target.value })}>
          <option value="">All actions</option>
          {AUDIT_GROUPS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
        {data && (
          <span className="ui-filterbar__note ui-filterbar__note--end">
            {data.total} {data.total === 1 ? "entry" : "entries"}
          </span>
        )}
      </FilterBar>

      {a.error && data && <Alert tone="warning">Showing the last loaded page (refresh failed: {a.error})</Alert>}

      <div className={a.loading ? "ui-dim" : undefined}>
        <DataTable columns={columns} rows={data?.rows ?? []} rowKey={(r) => String(r.id)} loading={!data && !a.error} error={!data && a.error ? `Couldn't load the audit log: ${a.error}` : null} emptyTitle="Nothing recorded in this range" />
      </div>

      {data && pages > 1 && (
        <div className="ui-pager">
          <span>
            Page {a.page} of {pages}
          </span>
          <Button size="sm" disabled={a.page <= 1} onClick={() => a.setPage(a.page - 1)}>
            Previous
          </Button>
          <Button size="sm" disabled={a.page >= pages} onClick={() => a.setPage(a.page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
