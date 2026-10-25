import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import { useAdmins } from "../../hooks/useAdmins";
import type { Admin, AdminRole } from "../../types/admins";
import { Alert, Badge, Button, DataTable, Field, Mark, PageHeader, Who } from "../../components/ui";
import type { Column } from "../../components/ui";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatDate } from "../../utils/formatDate";

type Dialog = { kind: "add" } | { kind: "edit" | "reset" | "toggle"; admin: Admin } | null;
const EMPTY = { full_name: "", email: "", password: "", role: "admin" as AdminRole };

export default function AdminsPage() {
  const { rows, loaded, error, clearError, add, edit, setActive, resetPassword } = useAdmins();
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

  const columns: Column<Admin>[] = [
    { key: "admin", label: "Admin", mobile: "title", cell: (a) => <Who name={a.full_name} meta={a.email} /> },
    { key: "role", label: "Role", mobile: "inline", cell: (a) => (a.role === "super_admin" ? <Badge tone="dark">Super admin</Badge> : <Badge>Admin</Badge>) },
    { key: "status", label: "Status", mobile: "inline", cell: (a) => <Mark tone={a.status === "active" ? "leaf" : "mist"}>{a.status === "active" ? "Active" : "Suspended"}</Mark> },
    { key: "added", label: "Added", mobile: "hide", nowrap: true, cell: (a) => <span className="ui-cell__meta">{formatDate(a.created_at)}</span> },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      mobile: "actions",
      cell: (a) => (
        <div className="ui-actions">
          <Button size="sm" aria-label={`Edit ${a.full_name}`} onClick={() => open({ kind: "edit", admin: a })}>
            Edit
          </Button>
          <Button size="sm" aria-label={`Reset password for ${a.full_name}`} onClick={() => open({ kind: "reset", admin: a })}>
            Reset password
          </Button>
          <Button size="sm" variant={a.status === "active" ? "danger-ghost" : "secondary"} aria-label={`${a.status === "active" ? "Suspend" : "Enable"} ${a.full_name}`} onClick={() => open({ kind: "toggle", admin: a })}>
            {a.status === "active" ? "Suspend" : "Enable"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admins"
        subtitle="Who can sign in to this panel"
        actions={
          <Button variant="primary" onClick={() => open({ kind: "add" })}>
            <LuPlus aria-hidden="true" /> Add admin
          </Button>
        }
      />

      <DataTable columns={columns} rows={rows} rowKey={(a) => a.id} loading={!loaded && !error} error={dialog ? null : error} emptyTitle="No admins yet" />

      <Modal open={formOpen} title={title} onClose={close}>
        <form className="modal__form" onSubmit={submit}>
          {showName && (
            <Field label="Full name">
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </Field>
          )}
          {dialog?.kind === "add" && (
            <Field label="Email">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Field>
          )}
          {showPassword && (
            <Field label={dialog?.kind === "add" ? "Initial password" : "New password"} hint="At least 8 characters">
              <input type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </Field>
          )}
          {showName && (
            <Field label="Role">
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}>
                <option value="admin">Admin</option>
                <option value="super_admin">Super admin</option>
              </select>
            </Field>
          )}
          {error && <Alert>{error}</Alert>}
          <div className="modal__actions">
            <Button onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={dialog?.kind === "toggle"}
        title={target?.status === "active" ? "Suspend admin" : "Enable admin"}
        message={target?.status === "active" ? `${target.full_name} will be signed out and unable to log in.` : `${target?.full_name} will be able to log in again.`}
        confirmLabel={target?.status === "active" ? "Suspend" : "Enable"}
        tone={target?.status === "active" ? "danger" : "primary"}
        onCancel={close}
        onConfirm={toggle}
      />
    </div>
  );
}
