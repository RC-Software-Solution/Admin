import { useState } from "react";
import "../admins/admins.css";
import "./sessions.css";
import { useSessions } from "../../hooks/useSessions";
import { useFoodItems } from "../../hooks/useFoodItems";
import type { MealSession, MealTime, SessionForm } from "../../types/menu";
import { PlusIcon } from "../../components/common/Icons";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatMoney } from "../../utils/formatMoney";

type Dialog = { kind: "add" } | { kind: "edit" | "delete" | "items"; session: MealSession } | null;
// Suggested windows; the admin can change them.
const DEFAULT_TIMES: Record<MealTime, [string, string]> = { breakfast: ["06:00", "09:00"], lunch: ["11:00", "14:00"], dinner: ["18:00", "21:00"] };
const hhmm = (t: string) => t.slice(0, 5);

export default function SessionsPage() {
  const { date, setDate, rows, error, clearError, add, edit, remove, attach, setQuantity, detach } = useSessions();
  const { rows: catalog } = useFoodItems();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState<SessionForm>({ date, meal_time: "lunch", start_time: "11:00", end_time: "14:00" });
  const [picked, setPicked] = useState<Record<number, string>>({}); // food_item_id -> quantity text ("" = unlimited)
  const close = () => setDialog(null);

  const open = (d: NonNullable<Dialog>) => {
    clearError();
    setPicked({});
    if (d.kind === "edit") setForm({ date: d.session.date, meal_time: d.session.meal_time, start_time: hhmm(d.session.start_time), end_time: hhmm(d.session.end_time) });
    if (d.kind === "add") {
      const free = (["breakfast", "lunch", "dinner"] as const).find((m) => !rows.some((r) => r.meal_time === m)) ?? "lunch";
      setForm({ date, meal_time: free, start_time: DEFAULT_TIMES[free][0], end_time: DEFAULT_TIMES[free][1] });
    }
    setDialog(d);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog?.kind === "add" ? await add(form) : dialog?.kind === "edit" && (await edit(dialog.session.id, form))) close();
  };

  const attachPicked = async () => {
    if (dialog?.kind !== "items") return;
    const items = Object.entries(picked).map(([id, q]) => ({ food_item_id: Number(id), available_quantity: q ? Number(q) : null }));
    if (!items.length || (await attach(dialog.session.id, items))) close();
  };

  const confirmDelete = async () => {
    if (dialog?.kind === "delete") await remove(dialog.session.id);
    close();
  };

  const formOpen = dialog?.kind === "add" || dialog?.kind === "edit";
  const taken = dialog?.kind === "items" ? new Set(dialog.session.sessionItems.map((i) => i.food_item_id)) : new Set<number>();
  const pickable = catalog.filter((f) => !taken.has(f.id));

  return (
    <div className="admins-page">
      <div className="admins-card">
        <div className="admins-header">
          <div>
            <h1 className="admins-title">Sessions</h1>
            <p className="admins-subtitle">Meal sessions and what each one serves</p>
          </div>
          <button className="btn-add" onClick={() => open({ kind: "add" })} type="button">
            <span className="btn-add-plus"><PlusIcon className="icon-sm" /></span>
            New Session
          </button>
        </div>

        <div className="toolbar">
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>

        <Modal open={formOpen} title={dialog?.kind === "edit" ? `Edit ${dialog.session.meal_time}` : "New session"} onClose={close}>
          <form className="modal__form" onSubmit={submit}>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <select value={form.meal_time} onChange={(e) => setForm({ ...form, meal_time: e.target.value as MealTime })}>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
            <label>Opens <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required /></label>
            <label>Closes <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required /></label>
            {error && <p role="alert">{error}</p>}
            <div className="modal__actions">
              <button type="button" className="modal__btn" onClick={close}>Cancel</button>
              <button type="submit" className="modal__btn modal__btn--primary">Save</button>
            </div>
          </form>
        </Modal>

        <Modal open={dialog?.kind === "items"} title="Add items" onClose={close}>
          <div className="picker">
            {pickable.map((f) => (
              <label key={f.id} className="picker__row">
                <input
                  type="checkbox"
                  checked={f.id in picked}
                  onChange={(e) => setPicked((p) => { const n = { ...p }; if (e.target.checked) n[f.id] = ""; else delete n[f.id]; return n; })}
                />
                <span>{f.name} <small className="cell-muted">{formatMoney(Number(f.price))}</small></span>
                {f.id in picked && (
                  <input className="qty" type="number" min="1" placeholder="Unlimited" value={picked[f.id]} onChange={(e) => setPicked({ ...picked, [f.id]: e.target.value })} />
                )}
              </label>
            ))}
            {!pickable.length && <p className="cell-muted">Every catalog item is already in this session.</p>}
          </div>
          {error && <p role="alert">{error}</p>}
          <div className="modal__actions">
            <button type="button" className="modal__btn" onClick={close}>Cancel</button>
            <button type="button" className="modal__btn modal__btn--primary" onClick={attachPicked}>Add selected</button>
          </div>
        </Modal>

        <ConfirmDialog
          open={dialog?.kind === "delete"}
          title="Delete session"
          message={dialog?.kind === "delete" ? `Delete the ${dialog.session.meal_time} session on ${dialog.session.date}? Its items are removed too.` : ""}
          confirmLabel="Delete"
          onCancel={close}
          onConfirm={confirmDelete}
        />
        {!formOpen && dialog?.kind !== "items" && error && <p role="alert">{error}</p>}

        {rows.map((s) => (
          <section key={s.id} className="session">
            <div className="session__head">
              <h2 className="session__title">{s.meal_time} <small className="cell-muted">{hhmm(s.start_time)} – {hhmm(s.end_time)}</small></h2>
              <div className="session__actions">
                <button type="button" className="modal__btn" onClick={() => open({ kind: "items", session: s })}>Add items</button>
                <button type="button" className="modal__btn" onClick={() => open({ kind: "edit", session: s })}>Edit</button>
                <button type="button" className="modal__btn" onClick={() => open({ kind: "delete", session: s })}>Delete</button>
              </div>
            </div>
            <div className="table-wrap">
              <table className="admins-table">
                <thead><tr><th>Item</th><th>Price</th><th>Available qty</th><th></th></tr></thead>
                <tbody>
                  {s.sessionItems.map((i) => (
                    <tr key={i.id}>
                      <td className="cell-strong">{i.foodItem.name}</td>
                      <td>{formatMoney(Number(i.foodItem.price))}</td>
                      <td>
                        {/* key re-mounts the input when the saved value changes, so it always shows server truth */}
                        <input
                          key={i.available_quantity ?? "none"}
                          className="qty"
                          type="number"
                          min="0"
                          placeholder="Unlimited"
                          defaultValue={i.available_quantity ?? ""}
                          onBlur={(e) => {
                            const q = e.target.value === "" ? null : Number(e.target.value);
                            if (q !== i.available_quantity) setQuantity(i.id, q);
                          }}
                        />
                      </td>
                      <td className="cell-actions"><button type="button" className="modal__btn" onClick={() => detach(i.id)}>Remove</button></td>
                    </tr>
                  ))}
                  {!s.sessionItems.length && <tr><td colSpan={4} className="cell-muted">No items yet</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        {!rows.length && <p className="cell-muted">No sessions on this date.</p>}
      </div>
    </div>
  );
}
