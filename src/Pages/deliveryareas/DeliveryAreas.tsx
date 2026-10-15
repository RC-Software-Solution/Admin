import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./deliveryareas.css";
import { useDeliveryAreas } from "../../hooks/useDeliveryAreas";
import { PlusIcon, PinIcon, EditIcon } from "../../components/common/Icons";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatMoney } from "../../utils/formatMoney";
import type { AreaForm, DeliveryArea } from "../../types/deliveryAreas";

const EMPTY: AreaForm = { area_name: "", code: "", status: "active", notes: "" };

export default function DeliveryAreasPage() {
  const { areas, error, metricsAvailable, metricOf, onSave, onDelete } = useDeliveryAreas();
  const navigate = useNavigate();
  // `form`: null = closed, {} = adding, {area} = editing
  const [form, setForm] = useState<{ area?: DeliveryArea } | null>(null);
  const [values, setValues] = useState<AreaForm>(EMPTY);
  const [toDelete, setToDelete] = useState<DeliveryArea | null>(null);

  const openForm = (area?: DeliveryArea) => {
    setValues(area ? { area_name: area.area_name, code: area.code ?? "", status: area.status, notes: area.notes ?? "" } : EMPTY);
    setForm({ area });
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form && (await onSave(form.area, values))) setForm(null);
  };

  const assigned = toDelete?.assigned_users ?? 0;

  return (
    <div className="da-page">
      <div className="da-topbar">
        <div>
          <h1 className="da-title">Delivery Areas</h1>
          <p className="da-subtitle">Manage service areas</p>
        </div>

        <button className="da-addBtn" onClick={() => openForm()}>
          <span className="da-addBtnIcon">
            <PlusIcon />
          </span>
          Add Area
        </button>
      </div>

      {!form && error && <p role="alert">{error}</p>}

      <div className="da-grid">
        {areas.map((a) => {
          const m = metricOf(a);
          return (
            <div className="da-card" key={a.area_id}>
              <div className="da-cardTop">
                <div className="da-cardLeft">
                  <span className="da-pin">
                    <PinIcon />
                  </span>

                  <div className="da-nameBlock">
                    <div className="da-nameRow">
                      <span className="da-name">{a.area_name}</span>
                      <span className={`da-status ${a.status}`}>{a.status}</span>
                    </div>
                    <div className="da-code">{a.code ?? `#${a.area_id}`}</div>
                  </div>
                </div>
              </div>

              {a.notes && <p className="da-code">{a.notes}</p>}

              <div className="da-metrics">
                <div className="da-metricRow">
                  <span className="da-metricLabel">Assigned users</span>
                  <span className="da-metricValue">{a.assigned_users ?? "—"}</span>
                </div>
                <div className="da-metricRow">
                  <span className="da-metricLabel">Orders (all time)</span>
                  <span className="da-metricValue">{metricsAvailable ? m?.orderCount ?? 0 : "—"}</span>
                </div>
                <div className="da-metricRow">
                  <span className="da-metricLabel">Revenue (all time)</span>
                  <span className="da-metricValue">{formatMoney(metricsAvailable ? m?.totalRevenue ?? 0 : null)}</span>
                </div>
              </div>

              <div className="da-actions">
                <button className="da-actionBtn da-actionBtnGhost" onClick={() => openForm(a)}>
                  <EditIcon className="da-actionIcon" />
                  Edit
                </button>

                <button className="da-actionBtn da-actionBtnGhost" onClick={() => navigate(`/users?area=${a.area_id}`)}>
                  Users
                </button>

                <button className="da-actionBtn da-actionBtnPrimary" onClick={() => setToDelete(a)}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!form} title={form?.area ? "Edit area" : "New area"} onClose={() => setForm(null)}>
        <form className="modal__form" onSubmit={submit}>
          <input autoFocus placeholder="Area name" value={values.area_name} onChange={(e) => setValues({ ...values, area_name: e.target.value })} required />
          <input placeholder="Code (optional, e.g. KDY)" maxLength={20} value={values.code ?? ""} onChange={(e) => setValues({ ...values, code: e.target.value })} />
          <select value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value as AreaForm["status"] })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <textarea placeholder="Schedule notes (optional)" rows={3} value={values.notes ?? ""} onChange={(e) => setValues({ ...values, notes: e.target.value })} />
          {error && <p role="alert">{error}</p>}
          <div className="modal__actions">
            <button type="button" className="modal__btn" onClick={() => setForm(null)}>Cancel</button>
            <button type="submit" className="modal__btn modal__btn--primary">Save</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete area"
        message={
          assigned > 0
            ? `${assigned} user${assigned === 1 ? " is" : "s are"} assigned to "${toDelete?.area_name}". Deleting is refused until they are reassigned.`
            : `Delete "${toDelete?.area_name}"?`
        }
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await onDelete(toDelete);
          setToDelete(null);
        }}
      />
    </div>
  );
}
