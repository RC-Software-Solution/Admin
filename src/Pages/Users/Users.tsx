import { useState } from "react";
import "./users.css";
import { useUsers } from "../../hooks/useUsers";
import { DownloadIcon, EyeIcon } from "../../components/common/Icons";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { getSession } from "../../services/apiClient";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import { statusOf, type Customer } from "../../types/users";

type Dialog =
  | { kind: "approve" | "reject"; user: Customer }
  | { kind: "disable" | "enable" | "unlock"; user: Customer }
  | null;

const CONFIRM_COPY = {
  disable: { title: "Disable customer", verb: "Disable", text: "can no longer log in or order" },
  enable: { title: "Enable customer", verb: "Enable", text: "regains access" },
  unlock: { title: "Unlock customer", verb: "Unlock", text: "is unblocked and can order again" },
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

  const p = u.profile;
  const unpaid = p?.order_history.filter((o) => o.payment_status === "unpaid") ?? [];
  const confirmCopy = dialog && dialog.kind in CONFIRM_COPY ? CONFIRM_COPY[dialog.kind as keyof typeof CONFIRM_COPY] : null;

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="title">Users</h1>
          <p className="subtitle">Manage customer accounts</p>
        </div>

        <button className="btn btn-export" onClick={u.exportCsv}>
          <DownloadIcon className="icon" />
          Export
        </button>
      </div>

      {u.error && <p role="alert">{u.error}</p>}
      {u.areaFilter && (
        <p>
          Area: <strong>{u.areaName(u.areaFilter)}</strong>{" "}
          <button type="button" className="modal__btn" onClick={u.clearAreaFilter}>Clear</button>
        </p>
      )}

      <div className="users-toolbar">
        <div className="tabs">
          {u.tabs.map((t) => {
            const isActive = u.activeTab === t.key;
            return (
              <button key={t.key} className={`tab ${isActive ? "active" : ""}`} onClick={() => u.setActiveTab(t.key)}>
                {t.label}
                <span className={`count ${isActive ? "active" : ""}`}>{u.counts[t.key]}</span>
              </button>
            );
          })}
        </div>

        <div className="tools">
          <div className="search-wrap">
            <input
              className="search"
              placeholder="Search by name or email..."
              value={u.query}
              onChange={(e) => u.setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-card">
        <table className="users-table">
          <thead>
            <tr>
              <th className="col-name">Name</th>
              <th>Email</th>
              <th>Area</th>
              <th>Status</th>
              <th>Registered</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>

          <tbody>
            {u.filtered.length === 0 ? (
              <tr>
                <td className="empty" colSpan={6}>
                  No users found.
                </td>
              </tr>
            ) : (
              u.filtered.map((c) => {
                const status = statusOf(c);
                return (
                  <tr key={c.id}>
                    <td className="name">{c.full_name}</td>
                    <td className="muted">{c.email}</td>
                    <td className="muted">{u.areaName(c.area_id)}</td>
                    <td>
                      <span className={`status-pill ${status}`}>{status}</span>
                    </td>
                    <td className="muted">{formatDate(c.created_at)}</td>
                    <td>
                      <div className="actions">
                        <button className="icon-btn" onClick={() => u.openProfile(c.id)} aria-label="View" title="View">
                          <EyeIcon className="icon" />
                        </button>

                        {isSuper && status === "pending" && (
                          <>
                            <button className="pill-btn approve" onClick={() => open({ kind: "approve", user: c })}>
                              Approve
                            </button>
                            <button className="pill-btn reject" onClick={() => open({ kind: "reject", user: c })}>
                              Reject
                            </button>
                          </>
                        )}
                        {isSuper && status === "accepted" && (
                          <button className="pill-btn reject" onClick={() => open({ kind: "disable", user: c })}>
                            Disable
                          </button>
                        )}
                        {isSuper && status === "disabled" && (
                          <button className="pill-btn approve" onClick={() => open({ kind: "enable", user: c })}>
                            Enable
                          </button>
                        )}
                        {isSuper && status === "blocked" && (
                          <button className="pill-btn approve" onClick={() => open({ kind: "unlock", user: c })}>
                            Unlock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal open={dialog?.kind === "approve"} title={`Approve ${dialog?.user.full_name}`} onClose={close}>
        <form className="modal__form" onSubmit={submitApprove}>
          <label>
            Delivery area (required)
            <select value={areaId} onChange={(e) => setAreaId(e.target.value)} required>
              <option value="">Select an area…</option>
              {u.areas.map((a) => (
                <option key={a.area_id} value={a.area_id}>{a.area_name}</option>
              ))}
            </select>
          </label>
          <div className="modal__actions">
            <button type="button" className="modal__btn" onClick={close}>Cancel</button>
            <button type="submit" className="modal__btn modal__btn--primary">Approve</button>
          </div>
        </form>
      </Modal>

      <Modal open={dialog?.kind === "reject"} title={`Reject ${dialog?.user.full_name}`} onClose={close}>
        <form className="modal__form" onSubmit={submitReject}>
          <textarea
            placeholder="Reason (required)"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <div className="modal__actions">
            <button type="button" className="modal__btn" onClick={close}>Cancel</button>
            <button type="submit" className="modal__btn modal__btn--danger">Reject</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmCopy}
        title={confirmCopy?.title ?? ""}
        message={`${dialog?.user.full_name} ${confirmCopy?.text}. Continue?`}
        confirmLabel={confirmCopy?.verb}
        onCancel={close}
        onConfirm={confirm}
      />

      <Modal open={!!p} title={p?.full_name ?? ""} onClose={u.closeProfile}>
        {p && (
          <div className="profile">
            <p className="muted">
              {p.email} · {p.phone ?? "no phone"} · {u.areaName(p.area_id)}
            </p>
            {p.address && <p className="muted">{p.address}</p>}
            {p.rejection_reason && <p>Rejected: {p.rejection_reason}</p>}
            {p.blocked_reason && <p>Blocked: {p.blocked_reason}</p>}

            <h3>Unpaid</h3>
            <p>
              {unpaid.length} order{unpaid.length === 1 ? "" : "s"} ·{" "}
              {formatMoney(unpaid.reduce((s, o) => s + Number(o.total_price), 0))}
            </p>

            <h3>Orders ({p.order_history.length})</h3>
            <ul>
              {p.order_history.map((o) => (
                <li key={o.id}>
                  {formatDate(o.created_at)} · {o.meal_time} · {o.status} · {o.payment_status} · {formatMoney(Number(o.total_price))}
                </li>
              ))}
              {p.order_history.length === 0 && <li>No orders</li>}
            </ul>

            <h3>Status history</h3>
            <ul>
              {p.status_log.map((l) => (
                <li key={l.id}>
                  {formatDateTime(l.created_at)} · {l.previous_status ?? "—"} → {l.new_status}
                  {l.reason ? ` (${l.reason})` : ""}
                </li>
              ))}
              {p.status_log.length === 0 && <li>No changes recorded</li>}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}
