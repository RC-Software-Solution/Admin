import { useState } from "react";
import { useOrders } from "../../hooks/useOrders";
import { Alert, Badge, Button, Card, DataTable, Field, FilterBar, PageHeader, useToast } from "../../components/ui";
import type { BadgeTone, Column } from "../../components/ui";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatDateTime } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import { NEXT_STATUSES, type Order, type OrderStatus, type PaymentStatus } from "../../types/orders";

const STATUSES: OrderStatus[] = ["pending", "preparing", "delivering", "delivered", "completed", "cancelled", "delivery_failed"];
const PAYMENTS: PaymentStatus[] = ["pending", "paid", "unpaid", "ignored"];
const label = (s: string) => s.replace("_", " ");

const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  pending: "warning",
  preparing: "info",
  delivering: "info",
  delivered: "success",
  completed: "success",
  cancelled: "danger",
  delivery_failed: "danger",
};
const PAYMENT_TONE: Record<PaymentStatus, BadgeTone> = { pending: "warning", paid: "success", unpaid: "danger", ignored: "neutral" };

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

  const selectColumn: Column<Order> = {
    key: "select",
    label: "Select",
    mobile: "select",
    header: (
      <input
        type="checkbox"
        aria-label="Select all customers on this page"
        checked={allSelected}
        onChange={(e) => o.selectPage(e.target.checked)}
      />
    ),
    cell: (r) => (
      <input
        type="checkbox"
        aria-label={`Select ${r.customer_name ?? r.customer_id}`}
        checked={o.selected.includes(r.customer_id)}
        onChange={() => o.toggleCustomer(r.customer_id)}
      />
    ),
  };
  const columns: Column<Order>[] = [
    ...(unpaidOnly ? [selectColumn] : []),
    { key: "id", label: "Order", mobile: "title", cell: (r) => <span className="ui-mono">{r.id}</span> },
    { key: "customer", label: "Customer", cell: (r) => r.customer_name ?? r.customer_id.slice(0, 8) },
    { key: "area", label: "Area", cell: (r) => o.areaName(r.area_id) },
    { key: "items", label: "Items", cell: (r) => r.order_items.reduce((n, i) => n + i.quantity, 0) },
    { key: "total", label: "Total", cell: (r) => formatMoney(Number(r.total_price)) },
    { key: "status", label: "Status", cell: (r) => <Badge tone={STATUS_TONE[r.status]}>{label(r.status)}</Badge> },
    { key: "payment", label: "Payment", cell: (r) => <Badge tone={PAYMENT_TONE[r.payment_status]}>{r.payment_status}</Badge> },
    { key: "created", label: "Created", nowrap: true, cell: (r) => formatDateTime(r.created_at) },
    {
      key: "actions",
      label: "Actions",
      mobile: "actions",
      nowrap: true,
      cell: (r) => (
        <div className="ui-actions">
          {NEXT_STATUSES[r.status] && <Button size="sm" onClick={() => openStatus(r)}>Update status</Button>}
          {r.payment_status === "paid" ? (
            <Button size="sm" onClick={() => pay(r, "unpaid")}>Mark unpaid</Button>
          ) : (
            r.status !== "cancelled" && <Button size="sm" variant="primary" onClick={() => pay(r, "paid")}>Mark paid</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`Refreshes every 30s${o.updatedAt ? ` · updated ${o.updatedAt.toLocaleTimeString("en-LK", { timeZone: "Asia/Colombo" })}` : ""}`}
      />

      <FilterBar label="Order filters">
        <select value={o.filters.status} onChange={(e) => o.setFilter("status", e.target.value as OrderStatus | "")} aria-label="Status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
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
        <Button aria-pressed={unpaidOnly} onClick={() => o.setFilter("payment_status", unpaidOnly ? "" : "unpaid")}>
          Unpaid only
        </Button>
        {unpaidOnly && (
          <label className="ui-phone-only">
            <input type="checkbox" checked={allSelected} onChange={(e) => o.selectPage(e.target.checked)} />
            Select all on this page
          </label>
        )}
        {unpaidOnly && (
          <Button variant="primary" disabled={o.selected.length === 0} onClick={() => setConfirmingReminder(true)}>
            {o.selected.length === 0 ? "Notify customers" : `Notify ${o.selected.length} customer${o.selected.length === 1 ? "" : "s"}`}
          </Button>
        )}
      </FilterBar>
      {(o.filters.from === "") !== (o.filters.to === "") && <Alert tone="warning">Pick both dates to filter by date.</Alert>}

      <Card flush>
        <DataTable
          columns={columns}
          rows={o.orders}
          rowKey={(r) => r.id}
          loading={!o.loaded && !o.error}
          error={editing ? null : o.error}
          emptyTitle="No orders found"
        />
      </Card>

      <div className="ui-actions" style={{ justifyContent: "flex-end", alignItems: "center" }}>
        <Button disabled={o.page === 0} onClick={() => o.setPage(o.page - 1)}>Previous</Button>
        <span>Page {o.page + 1}</span>
        <Button disabled={!o.hasNext} onClick={() => o.setPage(o.page + 1)}>Next</Button>
      </div>

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
          <Field label="New status">
            <select value={next} onChange={(e) => setNext(e.target.value as OrderStatus)} required>
              {nextOptions.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </Field>
          {next === "delivery_failed" && (
            <Field label="Failure reason (required)">
              <textarea rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} required />
            </Field>
          )}
          {o.error && <Alert>{o.error}</Alert>}
          <div className="modal__actions">
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" variant="primary">Update</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
