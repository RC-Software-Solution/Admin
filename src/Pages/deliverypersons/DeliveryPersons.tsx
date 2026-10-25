import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import { useDeliveryPersons } from "../../hooks/useDeliveryPersons";
import type { DriverForm } from "./deliverypersons.service";
import type { DeliveryPerson } from "../../types/deliveryPersons";
import { Alert, Button, DataTable, Field, Mark, PageHeader, Who } from "../../components/ui";
import type { Column } from "../../components/ui";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";

type Dialog = { kind: "add" } | { kind: "edit" | "reset" | "toggle"; person: DeliveryPerson } | null;
const EMPTY: DriverForm = { full_name: "", email: "", password: "", phone: "", nic: "", vehicle_type: "" };

export default function DeliveryPersonsPage() {
  const { rows, loaded, error, clearError, add, edit, setActive, resetPassword } = useDeliveryPersons();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState(EMPTY);
  const close = () => setDialog(null);

  const open = (d: NonNullable<Dialog>) => {
    clearError();
    setForm(d.kind === "edit" ? { ...EMPTY, full_name: d.person.full_name, phone: d.person.phone ?? "", nic: d.person.nic ?? "", vehicle_type: d.person.vehicle_type ?? "" } : EMPTY);
    setDialog(d);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialog) return;
    const ok =
      dialog.kind === "add" ? await add(form)
      : dialog.kind === "edit" ? await edit(dialog.person.id, { full_name: form.full_name, phone: form.phone, nic: form.nic, vehicle_type: form.vehicle_type })
      : dialog.kind === "reset" ? await resetPassword(dialog.person.id, form.password)
      : true;
    if (ok) close();
  };

  const toggle = async () => {
    if (dialog?.kind === "toggle") await setActive(dialog.person.id, dialog.person.status !== "active");
    close();
  };

  const formOpen = dialog?.kind === "add" || dialog?.kind === "edit" || dialog?.kind === "reset";
  const target = dialog && dialog.kind !== "add" ? dialog.person : null;
  const title = dialog?.kind === "add" ? "Add delivery person" : dialog?.kind === "edit" ? `Edit ${target?.full_name}` : `Reset password for ${target?.full_name}`;
  const showProfile = dialog?.kind === "add" || dialog?.kind === "edit";
  const showPassword = dialog?.kind === "add" || dialog?.kind === "reset";
  const set = (k: keyof DriverForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const columns: Column<DeliveryPerson>[] = [
    { key: "driver", label: "Driver", mobile: "title", cell: (p) => <Who name={p.full_name} meta={p.email} /> },
    { key: "phone", label: "Phone", mobile: "hide", nowrap: true, cell: (p) => p.phone ?? "—" },
    { key: "nic", label: "NIC", mobile: "hide", nowrap: true, cell: (p) => p.nic ?? "—" },
    { key: "vehicle", label: "Vehicle", mobile: "hide", cell: (p) => p.vehicle_type ?? "—" },
    { key: "status", label: "Status", mobile: "inline", cell: (p) => <Mark tone={p.status === "active" ? "leaf" : "mist"}>{p.status === "active" ? "Active" : "Inactive"}</Mark> },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      mobile: "actions",
      cell: (p) => (
        <div className="ui-actions">
          <Button size="sm" aria-label={`Edit ${p.full_name}`} onClick={() => open({ kind: "edit", person: p })}>
            Edit
          </Button>
          <Button size="sm" aria-label={`Reset password for ${p.full_name}`} onClick={() => open({ kind: "reset", person: p })}>
            Reset password
          </Button>
          <Button size="sm" variant={p.status === "active" ? "danger-ghost" : "secondary"} aria-label={`${p.status === "active" ? "Disable" : "Enable"} ${p.full_name}`} onClick={() => open({ kind: "toggle", person: p })}>
            {p.status === "active" ? "Disable" : "Enable"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Delivery Persons"
        subtitle="Drivers who take orders to customers"
        actions={
          <Button variant="primary" onClick={() => open({ kind: "add" })}>
            <LuPlus aria-hidden="true" /> Add delivery person
          </Button>
        }
      />

      <DataTable columns={columns} rows={rows} rowKey={(p) => p.id} loading={!loaded && !error} error={dialog ? null : error} emptyTitle="No delivery persons yet" />

      <Modal open={formOpen} title={title} onClose={close}>
        <form className="modal__form" onSubmit={submit}>
          {showProfile && (
            <Field label="Full name">
              <input value={form.full_name} onChange={set("full_name")} required />
            </Field>
          )}
          {dialog?.kind === "add" && (
            <Field label="Email">
              <input type="email" value={form.email} onChange={set("email")} required />
            </Field>
          )}
          {showProfile && (
            <Field label="Phone" optional>
              <input type="tel" value={form.phone} onChange={set("phone")} />
            </Field>
          )}
          {showProfile && (
            <Field label="NIC" optional>
              <input maxLength={20} value={form.nic} onChange={set("nic")} />
            </Field>
          )}
          {showProfile && (
            <Field label="Vehicle type" optional>
              <input maxLength={50} value={form.vehicle_type} onChange={set("vehicle_type")} />
            </Field>
          )}
          {showPassword && (
            <Field label={dialog?.kind === "add" ? "Initial password" : "New password"} hint="At least 8 characters">
              <input type="password" minLength={8} value={form.password} onChange={set("password")} required />
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
        title={target?.status === "active" ? "Disable driver" : "Enable driver"}
        message={target?.status === "active" ? `${target.full_name} will be signed out and unable to log in.` : `${target?.full_name} will be able to log in again.`}
        confirmLabel={target?.status === "active" ? "Disable" : "Enable"}
        tone={target?.status === "active" ? "danger" : "primary"}
        onCancel={close}
        onConfirm={toggle}
      />
    </div>
  );
}
