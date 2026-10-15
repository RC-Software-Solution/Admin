import { api, ORDER_API } from "../../services/apiClient";
import type { Order, OrderFilters, OrderStatus, PaymentStatus } from "../../types/orders";

export const PAGE_SIZE = 25;

// Business days are Sri Lanka (UTC+5:30), whatever the browser's timezone.
const colombo = (day: string, time: string) => `${day}T${time}+05:30`;

/** Asks for one extra row so the caller can tell whether a next page exists. */
export function listOrders(f: OrderFilters, page: number, signal?: AbortSignal) {
  const q = new URLSearchParams({ type: "all", limit: String(PAGE_SIZE + 1), offset: String(page * PAGE_SIZE) });
  if (f.status) q.set("status", f.status);
  if (f.payment_status) q.set("payment_status", f.payment_status);
  if (f.area_id) q.set("area_id", f.area_id);
  if (f.from && f.to) {
    q.set("date_range", "custom");
    q.set("start_date", colombo(f.from, "00:00:00"));
    q.set("end_date", colombo(f.to, "23:59:59.999"));
  }
  return api<{ orders: Order[] }>(ORDER_API, `/orders?${q}`, { signal }).then((r) => r.orders);
}

export const updateOrderStatus = (id: string, status: OrderStatus, failure_reason?: string) =>
  api<unknown>(ORDER_API, `/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status, failure_reason }) });

export const updatePaymentStatus = (id: string, payment_status: PaymentStatus) =>
  api<unknown>(ORDER_API, `/orders/${id}/payment`, { method: "PUT", body: JSON.stringify({ payment_status }) });
