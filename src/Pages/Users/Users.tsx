import { useState } from "react";
import { LuDownload } from "react-icons/lu";
import "./customers.css";
import { useUsers } from "../../hooks/useUsers";
import { Alert, Avatar, Button, Chip, Chips, DataTable, Field, PageHeader, SearchField } from "../../components/ui";
import type { Column } from "../../components/ui";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { getSession } from "../../services/apiClient";
import { formatDateTime } from "../../utils/formatDate";
import { statusOf, type Customer } from "../../types/users";
import { ACTIONS, type CustomerAction } from "./customerActions";
import CustomerDrawer from "./CustomerDrawer";

type Dialog = { kind: CustomerAction; user: Customer } | null;

const CONFIRM_COPY = {
  disable: { title: "Disable customer", verb: "Disable", text: "can no longer log in or order", tone: "danger" },
  enable: { title: "Enable customer", verb: "Enable", text: "regains access", tone: "primary" },
  unlock: { title: "Unlock customer", verb: "Unlock", text: "is unblocked and can order again", tone: "primary" },
} as const;

export default function UsersPage() {
  const u = useUsers();
  // UI gating only; the backend checkRole is the enforcement
  const isSuper = getSession()?.role === "super_admin";

  const [dialog, setDialog] = useState<Dialog>(null);
  const [areaId, setAreaId] = useState("");
  const [reason, setReason] = useState("");
  const close = () => setDialog(null);

  const open = (d: NonNullable<Dialog>) => {
    setAreaId(String(d.user.area_id ?? ""));
    setReason("");
    setDialog(d);
  };

  const submitApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog?.kind === "approve" && (await u.approve(dialog.user, areaId))) close();
  };
  const submitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog?.kind === "reject" && reason.trim() && (await u.reject(dialog.user, reason.trim()))) close();
  };
  const confirm = async () => {
    if (!dialog || dialog.kind === "approve" || dialog.kind === "reject") return;
    await u[dialog.kind](dialog.user);
    close();
  };

  const confirmCopy = dialog && dialog.kind in CONFIRM_COPY ? CONFIRM_COPY[dialog.kind as keyof typeof CONFIRM_COPY] : null;

  const rowActions = (c: Customer) => (
    <div className="ui-actions">
      {isSuper &&
        ACTIONS[statusOf(c)].map((a) => (
          <Button key={a.kind} size="sm" variant={a.primary ? "primary" : "secondary"} aria-label={`${a.label} ${c.full_name}`} onClick={() => open({ kind: a.kind, user: c })}>
            {a.label}
          </Button>
        ))}
      <Button size="sm" variant="ghost" aria-label={`View ${c.full_name}`} onClick={() => u.openProfile(c.id)}>
        View
      </Button>
    </div>
  );

  const columns: Column<Customer>[] = [
    {
      key: "customer",
      label: "Customer",
      mobile: "title",
      cell: (c) => (
        <div className="cust">
          <Avatar name={c.full_name} />
          <div className="cust__text">
            <b className="ui-cell__title">{c.full_name}</b>
            <div className="ui-cell__meta">{c.email}</div>
          </div>
        </div>
      ),
    },
    { key: "phone", label: "Phone", mobile: "hide", nowrap: true, cell: (c) => c.phone ?? "—" },
    { key: "area", label: "Area", mobile: "hide", cell: (c) => u.areaName(c.area_id) },
    { key: "registered", label: "Registered", mobile: "hide", nowrap: true, cell: (c) => <span className="ui-cell__meta">{formatDateTime(c.created_at)}</span> },
    { key: "actions", label: "Actions", align: "right", mobile: "actions", cell: rowActions },
  ];

  const waiting = u.activeTab === "pending" ? " waiting" : "";

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Approve new customers and manage their accounts"
        actions={
          <Button onClick={u.exportCsv}>
            <LuDownload aria-hidden="true" /> Export CSV
          </Button>
        }
      />

      {u.areaFilter && (
        <Alert tone="info">
          Showing customers in <strong>{u.areaName(u.areaFilter)}</strong>.{" "}
          <Button size="sm" variant="ghost" onClick={u.clearAreaFilter}>
            Clear filter
          </Button>
        </Alert>
      )}

      <Chips label="Customer status">
        {u.tabs.map((t) => (
          <Chip key={t.key} selected={u.activeTab === t.key} count={u.counts[t.key]} onClick={() => u.setActiveTab(t.key)}>
            {t.label}
          </Chip>
        ))}
      </Chips>

      <div className="cust-tools">
        <SearchField label="Search customers" placeholder="Search by name or email" value={u.query} onChange={(e) => u.setQuery(e.target.value)} />
      </div>

      <DataTable
        columns={columns}
        rows={u.filtered}
        rowKey={(c) => c.id}
        loading={!u.loaded && !u.error}
        error={dialog ? null : u.error}
        emptyTitle="No customers found"
        rowTone={(c) => (statusOf(c) === "pending" ? "attn" : undefined)}
      />
      {u.filtered.length > 0 && (
        <p className="ui-hint">
          {u.filtered.length} {u.filtered.length === 1 ? "customer" : "customers"}
          {waiting}
        </p>
      )}

      <Modal open={dialog?.kind === "approve"} title={`Approve ${dialog?.user.full_name}`} onClose={close}>
        <form className="modal__form" onSubmit={submitApprove}>
          <Field label="Delivery area (required)">
            <select value={areaId} onChange={(e) => setAreaId(e.target.value)} required>
              <option value="">Select an area…</option>
              {u.areas.map((a) => (
                <option key={a.area_id} value={a.area_id}>{a.area_name}</option>
              ))}
            </select>
          </Field>
          {u.error && <Alert>{u.error}</Alert>}
          <div className="modal__actions">
            <Button onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary">Approve</Button>
          </div>
        </form>
      </Modal>

      <Modal open={dialog?.kind === "reject"} title={`Reject ${dialog?.user.full_name}`} onClose={close}>
        <form className="modal__form" onSubmit={submitReject}>
          <Field label="Reason (required)">
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required />
          </Field>
          {u.error && <Alert>{u.error}</Alert>}
          <div className="modal__actions">
            <Button onClick={close}>Cancel</Button>
            <Button type="submit" variant="danger">Reject</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmCopy}
        title={confirmCopy?.title ?? ""}
        message={`${dialog?.user.full_name} ${confirmCopy?.text}. Continue?`}
        confirmLabel={confirmCopy?.verb}
        tone={confirmCopy?.tone}
        onCancel={close}
        onConfirm={confirm}
      />

      <CustomerDrawer
        profile={u.profile}
        areaName={u.areaName(u.profile?.area_id ?? null)}
        canAct={isSuper}
        onClose={u.closeProfile}
        onAction={(kind) => {
          // close the drawer first so the profile is never stale behind the confirmation dialog
          if (u.profile) open({ kind, user: u.profile });
          u.closeProfile();
        }}
      />
    </div>
  );
}
