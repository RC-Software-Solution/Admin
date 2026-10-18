import { useState } from "react";
import { useOrders } from "../../hooks/useOrders";
import { Alert, Button, Chip, Chips, DataTable, Field, FilterBar, Menu, OrderTrack, PageHeader, PaymentMark, SelectionBar, useToast } from "../../components/ui";
import type { Column, MenuItem } from "../../components/ui";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatDateTime } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import { NEXT_STATUSES, type Order, type OrderStatus, type PaymentStatus } from "../../types/orders";

const STATUS_CHIPS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "delivering", label: "Delivering" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "delivery_failed", label: "Failed" },
];
const PAYMENTS: PaymentStatus[] = ["pending", "paid", "unpaid", "ignored"];
const label = (s: string) => s.replace("_", " ");
// Wording of the one-click button for each forward move (the first entry of NEXT_STATUSES)
const ADVANCE_LABEL: Partial<Record<OrderStatus, string>> = { preparing: "Move to preparing", delivering: "Move to delivering", delivered: "Mark delivered" };
// Wording of the choices in the update-status dialog
const MOVE_LABEL: Partial<Record<OrderStatus, string>> = { preparing: "Preparing", delivering: "Delivering", delivered: "Delivered", cancelled: "Cancel the order", delivery_failed: "Delivery failed" };
const itemCount = (o: Order) => o.order_items.reduce((n, i) => n + i.quantity, 0);

export default function OrdersPage() {
  const o = useOrders();
  const toast = useToast();
  const [editing, setEditing] = useState<Order | null>(null);
  const [next, setNext] = useState<OrderStatus | "">("");
  const [reason, setReason] = useState("");
  const [confirmingReminder, setConfirmingReminder] = useState(false);

  const openStatus = (order: Order) => {
    setNext(NEXT_STATUSES[order.status]?.[0] ?? "");
    setReason("");
    setEditing(order);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing && next && (await o.setStatus(editing, next, reason.trim() || undefined))) {
      setEditing(null);
      toast.show("Order updated");
    }
  };
  const advance = async (order: Order, to: OrderStatus) => {
    if (await o.setStatus(order, to)) toast.show(`Moved to ${label(to)}`);
  };
  const pay = async (order: Order, status: PaymentStatus) => {
    if (await o.setPayment(order, status)) toast.show(`Marked ${status}`);
  };
  const sendReminders = async () => {
    setConfirmingReminder(false);
    const summary = await o.sendReminders();
    if (summary) toast.show(summary);
  };

  const unpaidOnly = o.filters.payment_status === "unpaid";
  const nextOptions = (editing && NEXT_STATUSES[editing.status]) || [];
  const allSelected = o.orders.length > 0 && o.orders.every((r) => o.selected.includes(r.customer_id));

  // One next action per row: the forward move, or "Mark paid" once the order has gone as far as it can.
  const rowActions = (r: Order) => {
    const forward = NEXT_STATUSES[r.status]?.[0];
    const canPay = r.payment_status !== "paid" && r.status !== "cancelled";
    const primary = forward ? (
      <Button size="sm" onClick={() => advance(r, forward)}>{ADVANCE_LABEL[forward] ?? `Move to ${label(forward)}`}</Button>
    ) : canPay ? (
      <Button size="sm" variant="primary" onClick={() => pay(r, "paid")}>Mark paid</Button>
    ) : null;
    const items: MenuItem[] = [];
    if (NEXT_STATUSES[r.status]) items.push({ label: "Update status…", onSelect: () => openStatus(r) });
    if (forward && canPay) items.push({ label: "Mark paid", onSelect: () => pay(r, "paid") });
    if (r.payment_status === "paid") items.push({ label: "Mark unpaid", onSelect: () => pay(r, "unpaid") });
    return (
      <div className="ui-actions">
        {primary}
        <Menu label={`More actions for ${r.id}`} items={items} />
      </div>
    );
  };

  const selectColumn: Column<Order> = {
    key: "select",
    label: "Select",
    mobile: "select",
    header: <input type="checkbox" aria-label="Select all customers on this page" checked={allSelected} onChange={(e) => o.selectPage(e.target.checked)} />,
    cell: (r) => (
      <input type="checkbox" aria-label={`Select ${r.customer_name ?? r.customer_id}`} checked={o.selected.includes(r.customer_id)} onChange={() => o.toggleCustomer(r.customer_id)} />
    ),
  };
  const columns: Column<Order>[] = [
    ...(unpaidOnly ? [selectColumn] : []),
    {
      key: "customer",
      label: "Customer",
      mobile: "title",
      cell: (r) => (
        <div>
          <b className="ui-cell__title">{r.customer_name ?? r.customer_id.slice(0, 8)}</b>
          <div className="ui-cell__meta">
            {r.id} · {o.areaName(r.area_id)} · {itemCount(r)} {itemCount(r) === 1 ? "item" : "items"} · {formatDateTime(r.created_at)}
          </div>
        </div>
      ),
    },
    { key: "total", label: "Total", align: "right", mobile: "amount", cell: (r) => <strong>{formatMoney(Number(r.total_price))}</strong> },
    { key: "progress", label: "Progress", mobile: "inline", cell: (r) => <OrderTrack status={r.status} /> },
    { key: "payment", label: "Payment", mobile: "inline", cell: (r) => <PaymentMark status={r.payment_status} /> },
    { key: "actions", label: "Next step", align: "right", mobile: "actions", cell: rowActions },
  ];

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`Refreshes every 30 seconds${o.updatedAt ? ` · updated ${o.updatedAt.toLocaleTimeString("en-LK", { timeZone: "Asia/Colombo" })}` : ""}`}
      />

      <Chips label="Order status">
        {STATUS_CHIPS.map((c) => (
          <Chip key={c.label} selected={o.filters.status === c.value} onClick={() => o.setFilter("status", c.value)}>
            {c.label}
          </Chip>
        ))}
      </Chips>

      <FilterBar label="Order filters">
        <select value={o.filters.payment_status} onChange={(e) => o.setFilter("payment_status", e.target.value as PaymentStatus | "")} aria-label="Payment">
          <option value="">All payments</option>
          {PAYMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={o.filters.area_id} onChange={(e) => o.setFilter("area_id", e.target.value)} aria-label="Area">
          <option value="">All areas</option>
          {o.areas.map((a) => <option key={a.area_id} value={a.area_id}>{a.area_name}</option>)}
        </select>
        <input type="search" placeholder="Order id…" value={o.filters.q} onChange={(e) => o.setFilter("q", e.target.value.trim())} aria-label="Order id" />
        <label>
          From <input type="date" value={o.filters.from} max={o.filters.to || undefined} onChange={(e) => o.setFilter("from", e.target.value)} />
        </label>
        <label>
          To <input type="date" value={o.filters.to} min={o.filters.from || undefined} onChange={(e) => o.setFilter("to", e.target.value)} />
        </label>
        <Chip attention selected={unpaidOnly} onClick={() => o.setFilter("payment_status", unpaidOnly ? "" : "unpaid")}>
          Unpaid only
        </Chip>
        {unpaidOnly && (
          <label className="ui-phone-only">
            <input type="checkbox" checked={allSelected} onChange={(e) => o.selectPage(e.target.checked)} />
            Select all on this page
          </label>
        )}
      </FilterBar>
      {(o.filters.from === "") !== (o.filters.to === "") && <Alert tone="warning">Pick both dates to filter by date.</Alert>}
      {unpaidOnly && o.selected.length === 0 && <p className="ui-hint">Tick customers to send them a payment reminder.</p>}

      <DataTable
        columns={columns}
        rows={o.orders}
        rowKey={(r) => r.id}
        loading={!o.loaded && !o.error}
        error={editing ? null : o.error}
        emptyTitle="No orders found"
        rowTone={(r) => (r.status === "delivery_failed" ? "bad" : r.payment_status === "unpaid" || r.status === "pending" ? "attn" : undefined)}
      />

      <div className="ui-pager">
        <Button size="sm" disabled={o.page === 0} onClick={() => o.setPage(o.page - 1)}>Previous</Button>
        <span>Page {o.page + 1}</span>
        <Button size="sm" disabled={!o.hasNext} onClick={() => o.setPage(o.page + 1)}>Next</Button>
      </div>

      {unpaidOnly && o.selected.length > 0 && (
        <SelectionBar label="Selected customers">
          <span><strong>{o.selected.length}</strong> customer{o.selected.length === 1 ? "" : "s"} selected</span>
          <Button variant="primary" onClick={() => setConfirmingReminder(true)}>Send payment reminder</Button>
        </SelectionBar>
      )}

      <ConfirmDialog
        open={confirmingReminder}
        title="Send payment reminders"
        message={`Send a payment reminder to ${o.selected.length} customer${o.selected.length === 1 ? "" : "s"}? Each gets one push with their unpaid total. Customers without the app installed will not receive it.`}
        confirmLabel="Send"
        tone="primary"
        onCancel={() => setConfirmingReminder(false)}
        onConfirm={sendReminders}
      />

      <Modal open={!!editing} title={`Update ${editing?.id ?? ""}`} onClose={() => setEditing(null)}>
        <form className="modal__form" onSubmit={submit}>
          {editing && (
            <div>
              <OrderTrack status={editing.status} />
              <p className="ui-hint" style={{ margin: "var(--space-2) 0 0" }}>
                {editing.customer_name ?? editing.customer_id.slice(0, 8)} · {o.areaName(editing.area_id)} · {formatMoney(Number(editing.total_price))}
              </p>
            </div>
          )}
          <fieldset className="ui-radios">
            <legend>Move to</legend>
            {nextOptions.map((s) => (
              <label key={s} className={`ui-radio${next === s ? " is-on" : ""}${s === "delivery_failed" || s === "cancelled" ? " is-bad" : ""}`}>
                <input type="radio" name="next-status" required checked={next === s} onChange={() => setNext(s)} />
                {MOVE_LABEL[s] ?? label(s)}
              </label>
            ))}
          </fieldset>
          {next === "delivery_failed" && (
            <Field label="What went wrong? (required)">
              <textarea rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} required />
            </Field>
          )}
          {o.error && <Alert>{o.error}</Alert>}
          <div className="modal__actions">
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" variant={next === "delivery_failed" || next === "cancelled" ? "danger" : "primary"}>
              {next === "delivery_failed" ? "Mark delivery failed" : next === "cancelled" ? "Cancel order" : next ? `Move to ${label(next)}` : "Update"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
