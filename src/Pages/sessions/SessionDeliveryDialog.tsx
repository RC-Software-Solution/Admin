import "./sessions.css";
import Modal from "../../components/common/Modal";
import { Alert, Button, Field, Spinner } from "../../components/ui";
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
        <Spinner label="Loading" />
      ) : (
        <div className="sess-picker">
          {areas.map((a) => (
            <Field key={a.area_id} label={a.area_name}>
              <select value={choice[Number(a.area_id)] ?? ""} onChange={(e) => assign(Number(a.area_id), e.target.value)}>
                <option value="">Unassigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))}
              </select>
            </Field>
          ))}
          {!areas.length && <p className="ui-hint">No delivery areas yet.</p>}
          {!drivers.length && <p className="ui-hint">No active delivery persons. Add one on the Delivery Persons page.</p>}
        </div>
      )}
      {error && <Alert>{error}</Alert>}
      <div className="modal__actions">
        <span className="ui-hint">
          {assignedCount} of {areas.length} areas assigned
        </span>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={loading} onClick={async () => (await save()) && onClose()}>
          Save
        </Button>
      </div>
    </Modal>
  );
}
