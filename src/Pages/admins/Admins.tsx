import { useState } from "react";
import "./admins.css";
import { useAdmins } from "../../hooks/useAdmins";
import type { Admin, AdminRole } from "../../types/admins";
import { PlusIcon } from "../../components/common/Icons";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatDate } from "../../utils/formatDate";

type Dialog = { kind: "add" } | { kind: "edit" | "reset" | "toggle"; admin: Admin } | null;
const EMPTY = { full_name: "", email: "", password: "", role: "admin" as AdminRole };

export default function AdminsPage() {
  const { rows, error, clearError, add, edit, setActive, resetPassword } = useAdmins();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState(EMPTY);
  const close = () => setDialog(null);

  const open = (d: NonNullable<Dialog>) => {
    clearError();
    setForm(d.kind === "edit" ? { ...EMPTY, full_name: d.admin.full_name, role: d.admin.role } : EMPTY);
    setDialog(d);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialog) return;
    const ok =
      dialog.kind === "add" ? await add(form)
      : dialog.kind === "edit" ? await edit(dialog.admin.id, { full_name: form.full_name, role: form.role })
      : dialog.kind === "reset" ? await resetPassword(dialog.admin.id, form.password)
      : true;
    if (ok) close();
  };

  const toggle = async () => {
    if (dialog?.kind === "toggle") await setActive(dialog.admin.id, dialog.admin.status !== "active");
    close();
  };

  const formOpen = dialog?.kind === "add" || dialog?.kind === "edit" || dialog?.kind === "reset";
  const target = dialog && dialog.kind !== "add" ? dialog.admin : null;
  const title = dialog?.kind === "add" ? "Add admin" : dialog?.kind === "edit" ? `Edit ${target?.full_name}` : `Reset password for ${target?.full_name}`;
  const showName = dialog?.kind === "add" || dialog?.kind === "edit";
  const showPassword = dialog?.kind === "add" || dialog?.kind === "reset";

  return (
    <div className="admins-page">
      <div className="admins-card">
        <div className="admins-header">
          <div>
            <h1 className="admins-title">Admins</h1>
            <p className="admins-subtitle">Manage administrative users</p>
          </div>

          <button className="btn-add" onClick={() => open({ kind: "add" })} type="button">
            <span className="btn-add-plus">
              <PlusIcon className="icon-sm" />
            </span>
            Add Admin
          </button>
        </div>

        <Modal open={formOpen} title={title} onClose={close}>
          <form className="modal__form" onSubmit={submit}>
            {showName && (
              <input placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            )}
            {dialog?.kind === "add" && (
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            )}
            {showPassword && (
              <input type="password" placeholder={dialog?.kind === "add" ? "Initial password (8+ chars)" : "New password (8+ chars)"} minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            )}
            {showName && (
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            )}
            {error && <p role="alert">{error}</p>}
            <div className="modal__actions">
              <button type="button" className="modal__btn" onClick={close}>Cancel</button>
              <button type="submit" className="modal__btn modal__btn--primary">Save</button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={dialog?.kind === "toggle"}
          title={target?.status === "active" ? "Suspend admin" : "Enable admin"}
          message={
            target?.status === "active"
              ? `${target.full_name} will be signed out and unable to log in.`
              : `${target?.full_name} will be able to log in again.`
          }
          confirmLabel={target?.status === "active" ? "Suspend" : "Enable"}
          onCancel={close}
          onConfirm={toggle}
        />
        {!formOpen && error && <p role="alert">{error}</p>}

        <div className="table-wrap">
          <table className="admins-table" role="table">
            <thead>
              <tr>
                <th className="col-name">Name</th>
                <th className="col-email">Email</th>
                <th className="col-role">Role</th>
                <th className="col-status">Status</th>
                <th className="col-date">Created Date</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="cell-strong">{a.full_name}</td>
                  <td className="cell-muted">{a.email}</td>

                  <td>
                    <span
                      className={
                        a.role === "super_admin"
                          ? "pill pill-green"
                          : "pill pill-blue"
                      }
                    >
                      {a.role === "super_admin" ? "Super Admin" : "Admin"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        a.status === "active"
                          ? "pill pill-status-active"
                          : "pill pill-status-suspended"
                      }
                    >
                      {a.status}
                    </span>
                  </td>

                  <td className="cell-muted">{formatDate(a.created_at)}</td>

                  <td className="cell-actions">
                    <button type="button" className="modal__btn" onClick={() => open({ kind: "edit", admin: a })}>Edit</button>
                    <button type="button" className="modal__btn" onClick={() => open({ kind: "toggle", admin: a })}>
                      {a.status === "active" ? "Suspend" : "Enable"}
                    </button>
                    <button type="button" className="modal__btn" onClick={() => open({ kind: "reset", admin: a })}>Reset password</button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
