import { useState } from "react";
import "../admins/admins.css";
import { useDeliveryPersons } from "../../hooks/useDeliveryPersons";
import type { DriverForm } from "./deliverypersons.service";
import type { DeliveryPerson } from "../../types/deliveryPersons";
import { PlusIcon } from "../../components/common/Icons";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";

type Dialog = { kind: "add" } | { kind: "edit" | "reset" | "toggle"; person: DeliveryPerson } | null;
const EMPTY: DriverForm = { full_name: "", email: "", password: "", phone: "", nic: "", vehicle_type: "", area_id: "" };

export default function DeliveryPersonsPage() {
  const { rows, areas, error, clearError, add, edit, setActive, resetPassword } = useDeliveryPersons();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState(EMPTY);
  const close = () => setDialog(null);

  const areaName = (id: DeliveryPerson["area_id"]) => areas.find((a) => String(a.area_id) === String(id))?.area_name ?? "—";

  const open = (d: NonNullable<Dialog>) => {
    clearError();
    setForm(d.kind === "edit" ? { ...EMPTY, full_name: d.person.full_name, phone: d.person.phone ?? "", nic: d.person.nic ?? "", vehicle_type: d.person.vehicle_type ?? "", area_id: String(d.person.area_id ?? "") } : EMPTY);
    setDialog(d);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialog) return;
    const ok =
      dialog.kind === "add" ? await add(form)
      : dialog.kind === "edit" ? await edit(dialog.person.id, { full_name: form.full_name, phone: form.phone, nic: form.nic, vehicle_type: form.vehicle_type, area_id: form.area_id })
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

  return (
    <div className="admins-page">
      <div className="admins-card">
        <div className="admins-header">
          <div>
            <h1 className="admins-title">Delivery Persons</h1>
            <p className="admins-subtitle">Drivers and the area each one serves</p>
          </div>
          <button className="btn-add" onClick={() => open({ kind: "add" })} type="button">
            <span className="btn-add-plus"><PlusIcon className="icon-sm" /></span>
            Add Driver
          </button>
        </div>

        <Modal open={formOpen} title={title} onClose={close}>
          <form className="modal__form" onSubmit={submit}>
            {showProfile && <input placeholder="Full name" value={form.full_name} onChange={set("full_name")} required />}
            {dialog?.kind === "add" && <input type="email" placeholder="Email" value={form.email} onChange={set("email")} required />}
            {showProfile && <input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={set("phone")} />}
            {showProfile && <input placeholder="NIC (optional)" maxLength={20} value={form.nic} onChange={set("nic")} />}
            {showProfile && <input placeholder="Vehicle type (optional)" maxLength={50} value={form.vehicle_type} onChange={set("vehicle_type")} />}
            {showProfile && (
              <select value={form.area_id} onChange={set("area_id")} required>
                <option value="" disabled>Select area</option>
                {areas.map((a) => <option key={a.area_id} value={a.area_id}>{a.area_name}</option>)}
              </select>
            )}
            {showPassword && (
              <input type="password" placeholder={dialog?.kind === "add" ? "Initial password (8+ chars)" : "New password (8+ chars)"} minLength={8} value={form.password} onChange={set("password")} required />
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
          title={target?.status === "active" ? "Disable driver" : "Enable driver"}
          message={
            target?.status === "active"
              ? `${target.full_name} will be signed out and unable to log in.`
              : `${target?.full_name} will be able to log in again.`
          }
          confirmLabel={target?.status === "active" ? "Disable" : "Enable"}
          onCancel={close}
          onConfirm={toggle}
        />
        {!formOpen && error && <p role="alert">{error}</p>}

        <div className="table-wrap">
          <table className="admins-table">
            <thead>
              <tr><th>Name</th><th>Contact</th><th>NIC</th><th>Vehicle</th><th>Area</th><th>Status</th><th className="col-actions">Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="cell-strong">{p.full_name}</td>
                  <td className="cell-muted">{p.email}{p.phone && <div>{p.phone}</div>}</td>
                  <td className="cell-muted">{p.nic ?? "—"}</td>
                  <td className="cell-muted">{p.vehicle_type ?? "—"}</td>
                  <td>{areaName(p.area_id)}</td>
                  <td><span className={p.status === "active" ? "pill pill-status-active" : "pill pill-status-suspended"}>{p.status}</span></td>
                  <td className="cell-actions">
                    <button type="button" className="modal__btn" onClick={() => open({ kind: "edit", person: p })}>Edit</button>
                    <button type="button" className="modal__btn" onClick={() => open({ kind: "toggle", person: p })}>{p.status === "active" ? "Disable" : "Enable"}</button>
                    <button type="button" className="modal__btn" onClick={() => open({ kind: "reset", person: p })}>Reset password</button>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={7} className="cell-muted">No delivery persons</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
