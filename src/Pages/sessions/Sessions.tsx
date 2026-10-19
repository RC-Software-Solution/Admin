import { useState } from "react";
import { LuChevronLeft, LuChevronRight, LuPlus, LuX } from "react-icons/lu";
import "./sessions.css";
import { useSessions } from "../../hooks/useSessions";
import { useFoodItems } from "../../hooks/useFoodItems";
import type { MealSession, MealTime, SessionForm, SessionItem } from "../../types/menu";
import type { Order } from "../../types/orders";
import { Alert, Badge, Button, Card, DataTable, Field, OrderTrack, PageHeader, PaymentMark, Who } from "../../components/ui";
import type { BadgeTone, Column } from "../../components/ui";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatMoney } from "../../utils/formatMoney";
import { addDays, formatDateTime } from "../../utils/formatDate";
import SessionDeliveryDialog from "./SessionDeliveryDialog";

type Dialog =
  | { kind: "add"; meal?: MealTime }
  | { kind: "edit" | "delete" | "items" | "delivery"; session: MealSession }
  | { kind: "qty"; item: SessionItem }
  | null;
const MEALS: MealTime[] = ["breakfast", "lunch", "dinner"];
// Suggested windows; the admin can change them.
const DEFAULT_TIMES: Record<MealTime, [string, string]> = { breakfast: ["06:00", "09:00"], lunch: ["11:00", "14:00"], dinner: ["18:00", "21:00"] };
const hhmm = (t: string) => t.slice(0, 5);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** upcoming / open / closed, from the Sri Lanka window (UTC+5:30, no DST). A window that ends at or before its start runs past midnight. */
function stateOf(s: MealSession, now = Date.now()): "upcoming" | "open" | "closed" {
  const start = new Date(`${s.date}T${s.start_time}+05:30`).getTime();
  let end = new Date(`${s.date}T${s.end_time}+05:30`).getTime();
  if (end <= start) end += 24 * 3600 * 1000;
  return now < start ? "upcoming" : now < end ? "open" : "closed";
}
const STATE: Record<ReturnType<typeof stateOf>, { tone: BadgeTone; label: string }> = {
  upcoming: { tone: "outline", label: "Upcoming" },
  open: { tone: "success", label: "Open now" },
  closed: { tone: "neutral", label: "Closed" },
};

export default function SessionsPage() {
  const { date, setDate, rows, error, orders, viewOrders, closeOrders, clearError, add, edit, remove, attach, setQuantity, detach } = useSessions();
  const { rows: catalog } = useFoodItems();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState<SessionForm>({ date, meal_time: "lunch", start_time: "11:00", end_time: "14:00", notes: "" });
  const [picked, setPicked] = useState<Record<number, string>>({}); // food_item_id -> quantity text ("" = unlimited)
  const [qtyText, setQtyText] = useState(""); // "" = unlimited
  const [ordersFor, setOrdersFor] = useState<MealSession | null>(null);
  const close = () => setDialog(null);

  const open = (d: NonNullable<Dialog>) => {
    clearError();
    setPicked({});
    if (d.kind === "edit") setForm({ date: d.session.date, meal_time: d.session.meal_time, start_time: hhmm(d.session.start_time), end_time: hhmm(d.session.end_time), notes: d.session.notes ?? "" });
    if (d.kind === "add") {
      const free = d.meal ?? MEALS.find((m) => !rows.some((r) => r.meal_time === m)) ?? "lunch";
      setForm({ date, meal_time: free, start_time: DEFAULT_TIMES[free][0], end_time: DEFAULT_TIMES[free][1], notes: "" });
    }
    if (d.kind === "qty") setQtyText(d.item.available_quantity == null ? "" : String(d.item.available_quantity));
    setDialog(d);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog?.kind === "add" ? await add(form) : dialog?.kind === "edit" && (await edit(dialog.session.id, form))) close();
  };

  const submitQty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog?.kind === "qty" && (await setQuantity(dialog.item.id, qtyText === "" ? null : Number(qtyText)))) close();
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
  const inForm = formOpen || dialog?.kind === "items" || dialog?.kind === "qty";

  const itemColumns = (s: MealSession): Column<SessionItem>[] => [
    {
      key: "item",
      label: "Item",
      mobile: "title",
      cell: (i) => <Who name={i.foodItem.name} meta={i.foodItem.is_active ? undefined : <Badge>Inactive</Badge>} square tone="auto" size="md" src={i.foodItem.image_url} />,
    },
    { key: "price", label: "Price", align: "right", mobile: "amount", cell: (i) => <strong>{formatMoney(Number(i.foodItem.price))}</strong> },
    { key: "available", label: "Available", mobile: "inline", cell: (i) => (i.available_quantity == null ? "Unlimited" : `${i.available_quantity} left`) },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      mobile: "actions",
      cell: (i) => (
        <div className="ui-actions">
          <Button size="sm" aria-label={`Change quantity of ${i.foodItem.name} for ${s.meal_time}`} onClick={() => open({ kind: "qty", item: i })}>
            Change quantity
          </Button>
          <Button size="sm" variant="danger-ghost" aria-label={`Remove ${i.foodItem.name} from ${s.meal_time}`} onClick={() => detach(i.id)}>
            <LuX aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  const orderColumns: Column<Order>[] = [
    {
      key: "customer",
      label: "Customer",
      mobile: "title",
      cell: (o) => (
        <div>
          <b className="ui-cell__title">{o.customer_name ?? "—"}</b>
          <div className="ui-cell__meta">{o.id} · {formatDateTime(o.created_at)}</div>
        </div>
      ),
    },
    { key: "items", label: "Items", cell: (o) => o.order_items.map((i) => `${i.quantity}x ${i.food_name}`).join(", ") },
    { key: "total", label: "Total", align: "right", mobile: "amount", cell: (o) => <strong>{formatMoney(Number(o.total_price))}</strong> },
    { key: "progress", label: "Progress", mobile: "inline", cell: (o) => <OrderTrack status={o.status} /> },
    { key: "payment", label: "Payment", mobile: "inline", cell: (o) => <PaymentMark status={o.payment_status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Sessions"
        subtitle="What customers can order, and when"
        actions={
          <Button variant="primary" onClick={() => open({ kind: "add" })}>
            <LuPlus aria-hidden="true" /> New session
          </Button>
        }
      />

      <div className="sess-date">
        <Button aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>
          <LuChevronLeft aria-hidden="true" />
        </Button>
        <input type="date" aria-label="Date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <Button aria-label="Next day" onClick={() => setDate(addDays(date, 1))}>
          <LuChevronRight aria-hidden="true" />
        </Button>
      </div>

      {!inForm && error && <Alert>{error}</Alert>}

      {MEALS.map((meal) => {
        const s = rows.find((r) => r.meal_time === meal);
        if (!s) {
          return (
            <Card key={meal} title={cap(meal)}>
              <div className="sess-empty">
                <p>No session for this date yet</p>
                <Button onClick={() => open({ kind: "add", meal })}>Add {meal} session</Button>
              </div>
            </Card>
          );
        }
        const state = STATE[stateOf(s)];
        return (
          <Card
            key={s.id}
            flush
            title={
              <span className="sess-title">
                {cap(s.meal_time)}
                <span className="sess-time">
                  {hhmm(s.start_time)} to {hhmm(s.end_time)}
                </span>
                <Badge tone={state.tone}>{state.label}</Badge>
              </span>
            }
            actions={
              <div className="ui-actions">
                <Button
                  size="sm"
                  onClick={() => {
                    setOrdersFor(s);
                    viewOrders(s);
                  }}
                >
                  View orders
                </Button>
                <Button size="sm" onClick={() => open({ kind: "delivery", session: s })}>
                  Assign deliveries
                </Button>
                <Button size="sm" variant="ghost" aria-label={`Edit ${s.meal_time}`} onClick={() => open({ kind: "edit", session: s })}>
                  Edit
                </Button>
                <Button size="sm" variant="danger-ghost" aria-label={`Delete ${s.meal_time}`} onClick={() => open({ kind: "delete", session: s })}>
                  Delete
                </Button>
              </div>
            }
          >
            {s.notes && <p className="sess-notes">Note for drivers: {s.notes}</p>}
            <DataTable columns={itemColumns(s)} rows={s.sessionItems} rowKey={(i) => String(i.id)} emptyTitle="No items yet" />
            <div className="sess-add">
              <Button size="sm" onClick={() => open({ kind: "items", session: s })}>
                <LuPlus aria-hidden="true" /> Add items
              </Button>
            </div>
          </Card>
        );
      })}

      <Modal open={formOpen} title={dialog?.kind === "edit" ? `Edit ${dialog.session.meal_time}` : "New session"} onClose={close}>
        <form className="modal__form" onSubmit={submit}>
          <Field label="Date">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </Field>
          <Field label="Meal">
            <select value={form.meal_time} onChange={(e) => setForm({ ...form, meal_time: e.target.value as MealTime })}>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </Field>
          <div className="ui-form-row">
            <Field label="Opens">
              <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
            </Field>
            <Field label="Closes">
              <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
            </Field>
          </div>
          <Field label="Notes for the team and drivers" optional>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          {error && <Alert>{error}</Alert>}
          <div className="modal__actions">
            <Button onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary">
              Save session
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={dialog?.kind === "qty"} title="Change quantity" onClose={close}>
        <form className="modal__form" onSubmit={submitQty}>
          {dialog?.kind === "qty" && <p className="modal__body">{dialog.item.foodItem.name}</p>}
          <Field label="Available quantity" hint="Leave empty for unlimited">
            <input type="number" min="0" step="1" placeholder="Unlimited" value={qtyText} onChange={(e) => setQtyText(e.target.value)} />
          </Field>
          {error && <Alert>{error}</Alert>}
          <div className="modal__actions">
            <Button onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary">
              Save quantity
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={dialog?.kind === "items"} title="Add items" onClose={close}>
        <div className="sess-picker">
          {pickable.map((f) => (
            <div key={f.id} className="sess-pick">
              <label className="sess-pick__name">
                <input
                  type="checkbox"
                  checked={f.id in picked}
                  onChange={(e) =>
                    setPicked((p) => {
                      const n = { ...p };
                      if (e.target.checked) n[f.id] = "";
                      else delete n[f.id];
                      return n;
                    })
                  }
                />{" "}
                {f.name} <span className="ui-cell__meta">{formatMoney(Number(f.price))}</span>
              </label>
              {f.id in picked && (
                <input type="number" min="1" placeholder="Unlimited" aria-label={`Quantity for ${f.name}`} value={picked[f.id]} onChange={(e) => setPicked({ ...picked, [f.id]: e.target.value })} />
              )}
            </div>
          ))}
          {!pickable.length && <p className="ui-hint">Every catalogue item is already in this session.</p>}
        </div>
        {error && <Alert>{error}</Alert>}
        <div className="modal__actions">
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={attachPicked}>
            Add selected
          </Button>
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

      <Modal open={orders !== null} title={ordersFor ? `${cap(ordersFor.meal_time)} orders` : "Orders"} onClose={closeOrders} wide>
        <DataTable columns={orderColumns} rows={orders ?? []} rowKey={(o) => o.id} emptyTitle="No orders for this session" />
        <div className="modal__actions">
          <Button onClick={closeOrders}>Close</Button>
        </div>
      </Modal>

      {dialog?.kind === "delivery" && <SessionDeliveryDialog session={dialog.session} onClose={close} />}
    </div>
  );
}
