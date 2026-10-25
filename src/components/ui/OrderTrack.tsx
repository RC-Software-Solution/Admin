import type { OrderStatus } from "../../types/orders"; // the one domain type the kit knows

// Four segments: pending, preparing, delivering, delivered. One state per segment.
const TRACK: Record<OrderStatus, { segs: string[]; label: string }> = {
  pending: { segs: ["wait", "", "", ""], label: "Pending" },
  preparing: { segs: ["on", "on", "", ""], label: "Preparing" },
  delivering: { segs: ["on", "on", "on", ""], label: "Delivering" },
  delivered: { segs: ["done", "done", "done", "done"], label: "Delivered" },
  completed: { segs: ["done", "done", "done", "done"], label: "Completed" },
  cancelled: { segs: ["x", "x", "x", "x"], label: "Cancelled" },
  delivery_failed: { segs: ["on", "on", "on", "bad"], label: "Delivery failed" },
};

/** How far an order has come. Turmeric asks for action, brick means it failed. */
export function OrderTrack({ status }: { status: OrderStatus }) {
  const { segs, label } = TRACK[status];
  return (
    <div className={`ui-track ui-track--${status}`} role="img" aria-label={label}>
      <div className="ui-track__bars">
        {segs.map((s, i) => (
          <i key={i} className={s ? `ui-seg ui-seg--${s}` : "ui-seg"} />
        ))}
      </div>
      <span className="ui-track__label" aria-hidden="true">{label}</span>
    </div>
  );
}
