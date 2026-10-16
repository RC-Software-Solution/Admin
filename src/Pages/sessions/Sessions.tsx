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
import { formatDateTime } from "../../utils/formatDate";
import SessionDeliveryDialog from "./SessionDeliveryDialog";

type Dialog = { kind: "add" } | { kind: "edit" | "delete" | "items" | "delivery"; session: MealSession } | null;
// Suggested windows; the admin can change them.
const DEFAULT_TIMES: Record<MealTime, [string, string]> = { breakfast: ["06:00", "09:00"], lunch: ["11:00", "14:00"], dinner: ["18:00", "21:00"] };
const hhmm = (t: string) => t.slice(0, 5);

/** upcoming / open / closed, from the Sri Lanka window (UTC+5:30, no DST). A window that ends at or before its start runs past midnight. */
function stateOf(s: MealSession, now = Date.now()): "upcoming" | "open" | "closed" {
  const start = new Date(`${s.date}T${s.start_time}+05:30`).getTime();
  let end = new Date(`${s.date}T${s.end_time}+05:30`).getTime();
  if (end <= start) end += 24 * 3600 * 1000;
  return now < start ? "upcoming" : now < end ? "open" : "closed";
}
const STATE_PILL = { upcoming: "pill pill-blue", open: "pill pill-status-active", closed: "pill pill-status-suspended" };

export default function SessionsPage() {
  const { date, setDate, rows, error, orders, viewOrders, closeOrders, clearError, add, edit, remove, attach, setQuantity, detach } = useSessions();
  const { rows: catalog } = useFoodItems();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState<SessionForm>({ date, meal_time: "lunch", start_time: "11:00", end_time: "14:00", notes: "" });
  const [picked, setPicked] = useState<Record<number, string>>({}); // food_item_id -> quantity text ("" = unlimited)
  const close = () => setDialog(null);

  const open = (d: NonNullable<Dialog>) => {
    clearError();
    setPicked({});
    if (d.kind === "edit") setForm({ date: d.session.date, meal_time: d.session.meal_time, start_time: hhmm(d.session.start_time), end_time: hhmm(d.session.end_time), notes: d.session.notes ?? "" });
    if (d.kind === "add") {
      const free = (["breakfast", "lunch", "dinner"] as const).find((m) => !rows.some((r) => r.meal_time === m)) ?? "lunch";
      setForm({ date, meal_time: free, start_time: DEFAULT_TIMES[free][0], end_time: DEFAULT_TIMES[free][1], notes: "" });
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
  const pickable = catalog.filter((f) => f.is_active && !taken.has(f.id));

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
            <textarea placeholder="Notes for the team and drivers (optional)" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
        <Modal open={orders !== null} title="Orders" onClose={closeOrders}>
          <div className="table-wrap">
            <table className="admins-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th><th>Placed</th></tr></thead>
              <tbody>
                {orders?.map((o) => (
                  <tr key={o.id}>
                    <td className="cell-strong">{o.id}</td>
                    <td>{o.customer_name ?? "-"}</td>
                    <td>{o.order_items.map((i) => `${i.quantity}x ${i.food_name}`).join(", ")}</td>
                    <td>{formatMoney(Number(o.total_price))}</td>
                    <td>{o.status}</td>
                    <td>{o.payment_status}</td>
                    <td className="cell-muted">{formatDateTime(o.created_at)}</td>
                  </tr>
                ))}
                {!orders?.length && <tr><td colSpan={7} className="cell-muted">No orders for this session</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="modal__actions"><button type="button" className="modal__btn" onClick={closeOrders}>Close</button></div>
        </Modal>

        {dialog?.kind === "delivery" && <SessionDeliveryDialog session={dialog.session} onClose={close} />}

        {!formOpen && dialog?.kind !== "items" && error && <p role="alert">{error}</p>}

        {rows.map((s) => (
          <section key={s.id} className="session">
            <div className="session__head">
              <h2 className="session__title">{s.meal_time} <small className="cell-muted">{hhmm(s.start_time)} – {hhmm(s.end_time)}</small> <span className={STATE_PILL[stateOf(s)]}>{stateOf(s)}</span></h2>
              <div className="session__actions">
                <button type="button" className="modal__btn" onClick={() => viewOrders(s)}>Orders</button>
                <button type="button" className="modal__btn" onClick={() => open({ kind: "delivery", session: s })}>Delivery</button>
                <button type="button" className="modal__btn" onClick={() => open({ kind: "items", session: s })}>Add items</button>
                <button type="button" className="modal__btn" onClick={() => open({ kind: "edit", session: s })}>Edit</button>
                <button type="button" className="modal__btn" onClick={() => open({ kind: "delete", session: s })}>Delete</button>
              </div>
            </div>
            {s.notes && <p className="session__notes">{s.notes}</p>}
            <div className="table-wrap">
              <table className="admins-table">
                <thead><tr><th>Item</th><th>Price</th><th>Available qty</th><th></th></tr></thead>
                <tbody>
                  {s.sessionItems.map((i) => (
                    <tr key={i.id}>
                      <td className="cell-strong">{i.foodItem.name}{!i.foodItem.is_active && <> <span className="pill pill-status-suspended">inactive</span></>}</td>
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
