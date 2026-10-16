import "../admins/admins.css";
import "./sessions.css";
import Modal from "../../components/common/Modal";
import { useSessionDelivery } from "../../hooks/useSessionDelivery";
import type { MealSession } from "../../types/menu";

interface Props {
  session: MealSession;
  onClose: () => void;
}

// Mounted only while open, so the data is fetched fresh each time the dialog is opened.
export default function SessionDeliveryDialog({ session, onClose }: Props) {
  const { areas, drivers, choice, loading, error, save, assign } = useSessionDelivery(session.id);
  const assignedCount = Object.values(choice).filter(Boolean).length;

  return (
    <Modal open title={`Delivery: ${session.meal_time} on ${session.date}`} onClose={onClose}>
      <p className="modal__body">Pick who delivers to each area in this session. Drivers can also take unassigned areas from their app.</p>
      {loading ? (
        <p className="cell-muted">Loading...</p>
      ) : (
        <div className="picker">
          {areas.map((a) => (
            <label key={a.area_id} className="picker__row">
              <span>{a.area_name}</span>
              <select value={choice[Number(a.area_id)] ?? ""} onChange={(e) => assign(Number(a.area_id), e.target.value)}>
                <option value="">Unassigned</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </label>
          ))}
          {!areas.length && <p className="cell-muted">No delivery areas yet.</p>}
          {!drivers.length && <p className="cell-muted">No active delivery persons. Add one on the Delivery Persons page.</p>}
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      <div className="modal__actions">
        <span className="cell-muted">{assignedCount} of {areas.length} areas assigned</span>
        <button type="button" className="modal__btn" onClick={onClose}>Cancel</button>
        <button type="button" className="modal__btn modal__btn--primary" disabled={loading} onClick={async () => (await save()) && onClose()}>Save</button>
      </div>
    </Modal>
  );
}
