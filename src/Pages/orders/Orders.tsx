import { useState } from "react";
import "./orders.css";
import { useOrders } from "../../hooks/useOrders";
import Modal from "../../components/common/Modal";
import { formatDateTime } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import { NEXT_STATUSES, type Order, type OrderStatus, type PaymentStatus } from "../../types/orders";

const STATUSES: OrderStatus[] = ["pending", "preparing", "delivering", "delivered", "completed", "cancelled", "delivery_failed"];
const PAYMENTS: PaymentStatus[] = ["pending", "paid", "unpaid", "ignored"];
const label = (s: string) => s.replace("_", " ");

export default function OrdersPage() {
  const o = useOrders();
  const [editing, setEditing] = useState<Order | null>(null);
  const [next, setNext] = useState<OrderStatus | "">("");
  const [reason, setReason] = useState("");

  const openStatus = (order: Order) => {
    setNext(NEXT_STATUSES[order.status]?.[0] ?? "");
    setReason("");
    setEditing(order);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing && next && (await o.setStatus(editing, next, reason.trim() || undefined))) setEditing(null);
  };

  const unpaidOnly = o.filters.payment_status === "unpaid";
  const nextOptions = (editing && NEXT_STATUSES[editing.status]) || [];

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <h1 className="orders-title">Orders</h1>
          <p className="orders-subtitle">
            Refreshes every 30s{o.updatedAt ? ` · updated ${o.updatedAt.toLocaleTimeString("en-LK", { timeZone: "Asia/Colombo" })}` : ""}
          </p>
        </div>
      </div>

      <div className="orders-filters">
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
        <label>
          From <input type="date" value={o.filters.from} max={o.filters.to || undefined} onChange={(e) => o.setFilter("from", e.target.value)} />
        </label>
        <label>
          To <input type="date" value={o.filters.to} min={o.filters.from || undefined} onChange={(e) => o.setFilter("to", e.target.value)} />
        </label>
        <button
          type="button"
          className={`orders-btn ${unpaidOnly ? "orders-btn--on" : ""}`}
          onClick={() => o.setFilter("payment_status", unpaidOnly ? "" : "unpaid")}
        >
          Unpaid only
        </button>
      </div>
      {(o.filters.from === "") !== (o.filters.to === "") && <p className="orders-hint">Pick both dates to filter by date.</p>}

      {o.error && <p role="alert">{o.error}</p>}

      <div className="orders-card">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Area</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {o.orders.length === 0 ? (
              <tr>
                <td className="orders-empty" colSpan={9}>{o.loaded ? "No orders found." : "Loading…"}</td>
              </tr>
            ) : (
              o.orders.map((r) => (
                <tr key={r.id}>
                  <td className="orders-id">{r.id}</td>
                  <td>{r.customer_name ?? r.customer_id.slice(0, 8)}</td>
                  <td>{o.areaName(r.area_id)}</td>
                  <td>{r.order_items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td>{formatMoney(Number(r.total_price))}</td>
                  <td><span className={`orders-pill st-${r.status}`}>{label(r.status)}</span></td>
                  <td><span className={`orders-pill pay-${r.payment_status}`}>{r.payment_status}</span></td>
                  <td>{formatDateTime(r.created_at)}</td>
                  <td className="orders-actions">
                    {NEXT_STATUSES[r.status] && (
                      <button type="button" className="orders-btn" onClick={() => openStatus(r)}>Update status</button>
                    )}
                    {r.payment_status === "paid" ? (
                      <button type="button" className="orders-btn" onClick={() => o.setPayment(r, "unpaid")}>Mark unpaid</button>
                    ) : (
                      r.status !== "cancelled" && (
                        <button type="button" className="orders-btn orders-btn--primary" onClick={() => o.setPayment(r, "paid")}>Mark paid</button>
                      )
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="orders-pager">
        <button type="button" className="orders-btn" disabled={o.page === 0} onClick={() => o.setPage(o.page - 1)}>Previous</button>
        <span>Page {o.page + 1}</span>
        <button type="button" className="orders-btn" disabled={!o.hasNext} onClick={() => o.setPage(o.page + 1)}>Next</button>
      </div>

      <Modal open={!!editing} title={`Update ${editing?.id ?? ""}`} onClose={() => setEditing(null)}>
        <form className="modal__form" onSubmit={submit}>
          <label>
            New status
            <select value={next} onChange={(e) => setNext(e.target.value as OrderStatus)} required>
              {nextOptions.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </label>
          {next === "delivery_failed" && (
            <textarea placeholder="Failure reason (required)" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} required />
          )}
          {o.error && <p role="alert">{o.error}</p>}
          <div className="modal__actions">
            <button type="button" className="modal__btn" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" className="modal__btn modal__btn--primary">Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
