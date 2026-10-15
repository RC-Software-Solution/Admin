import { useState } from "react";
import "./deliveryareas.css";
import { useDeliveryAreas } from "../../hooks/useDeliveryAreas";
import { PlusIcon, PinIcon, EditIcon } from "../../components/common/Icons";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import type { DeliveryArea } from "../../types/deliveryAreas";

export default function DeliveryAreasPage() {
  const { areas, error, onAdd, onRename, onDelete } = useDeliveryAreas();
  // `form`: null = closed, {} = adding, {area} = renaming
  const [form, setForm] = useState<{ area?: DeliveryArea } | null>(null);
  const [name, setName] = useState("");
  const [toDelete, setToDelete] = useState<DeliveryArea | null>(null);

  const openForm = (area?: DeliveryArea) => {
    setName(area?.area_name ?? "");
    setForm({ area });
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n || !form) return;
    if (form.area) {
      if (n !== form.area.area_name) onRename(form.area, n);
    } else {
      onAdd(n);
    }
    setForm(null);
  };

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

      {error && <p role="alert">{error}</p>}

      <div className="da-grid">
        {areas.map((a) => (
          <div className="da-card" key={a.area_id}>
            <div className="da-cardTop">
              <div className="da-cardLeft">
                <span className="da-pin">
                  <PinIcon />
                </span>

                <div className="da-nameBlock">
                  <div className="da-nameRow">
                    <span className="da-name">{a.area_name}</span>
                  </div>
                  <div className="da-code">#{a.area_id}</div>
                </div>
              </div>
            </div>

            <div className="da-actions">
              <button className="da-actionBtn da-actionBtnGhost" onClick={() => openForm(a)}>
                <EditIcon className="da-actionIcon" />
                Rename
              </button>

              <button className="da-actionBtn da-actionBtnPrimary" onClick={() => setToDelete(a)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!form} title={form?.area ? "Rename area" : "New area"} onClose={() => setForm(null)}>
        <form className="modal__form" onSubmit={submit}>
          <input autoFocus placeholder="Area name" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="modal__actions">
            <button type="button" className="modal__btn" onClick={() => setForm(null)}>Cancel</button>
            <button type="submit" className="modal__btn modal__btn--primary">Save</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete area"
        message={`Delete "${toDelete?.area_name}"?`}
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) onDelete(toDelete);
          setToDelete(null);
        }}
      />
    </div>
  );
}
