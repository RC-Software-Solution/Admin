import { Alert, Avatar, Badge, Button, Drawer, OrderTrack, PaymentMark } from "../../components/ui";
import type { BadgeTone } from "../../components/ui";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import { statusOf } from "../../types/users";
import type { CustomerProfile, UserStatus } from "../../types/users";
import { ACTIONS } from "./customerActions";
import type { CustomerAction } from "./customerActions";

const STATUS: Record<UserStatus, { tone: BadgeTone; label: string }> = {
  pending: { tone: "warning", label: "Pending approval" },
  accepted: { tone: "success", label: "Accepted" },
  rejected: { tone: "danger", label: "Rejected" },
  disabled: { tone: "neutral", label: "Disabled" },
  blocked: { tone: "danger", label: "Blocked" },
};
const labelOf = (s: string) => STATUS[s as UserStatus]?.label ?? s;
const MAX_ORDERS = 10;
const newestFirst = <T extends { created_at: string }>(rows: T[]) => [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));

interface CustomerDrawerProps {
  profile: CustomerProfile | null;
  areaName: string;
  canAct: boolean; // super admins only; the backend enforces it
  onClose: () => void;
  onAction: (kind: CustomerAction) => void;
}

/** A customer's details, unpaid warning, recent orders and status history, in a drawer over the list. */
export default function CustomerDrawer({ profile: p, areaName, canAct, onClose, onAction }: CustomerDrawerProps) {
  const status = p ? statusOf(p) : null;
  const unpaid = p?.order_history.filter((o) => o.payment_status === "unpaid") ?? [];
  const orders = p ? newestFirst(p.order_history) : [];
  const log = p ? newestFirst(p.status_log) : [];
  return (
    <Drawer open={!!p} label={p ? `${p.full_name}, customer profile` : "Customer profile"} onClose={onClose}>
      {p && status && (
        <>
          <div className="cust-head">
            <Avatar name={p.full_name} size="lg" />
            <div>
              <h2>{p.full_name}</h2>
              <div className="cust-head__meta">
                <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>
                <span>Registered {formatDateTime(p.created_at)}</span>
              </div>
            </div>
          </div>

          {canAct && ACTIONS[status].length > 0 && (
            <div className="ui-actions">
              {ACTIONS[status].map((a) => (
                <Button key={a.kind} variant={a.primary ? "primary" : "secondary"} onClick={() => onAction(a.kind)}>
                  {a.label}
                </Button>
              ))}
            </div>
          )}

          <dl className="cust-details">
            <div>
              <dt>Email</dt>
              <dd>{p.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{p.phone ?? "—"}</dd>
            </div>
            <div>
              <dt>Area</dt>
              <dd>{areaName}</dd>
            </div>
            <div className="cust-details__wide">
              <dt>Address</dt>
              <dd>{p.address ?? "—"}</dd>
            </div>
          </dl>

          {p.rejection_reason && (
            <Alert tone="warning">
              <strong>Rejected:</strong> {p.rejection_reason}
            </Alert>
          )}
          {p.blocked_reason && (
            <Alert tone="warning">
              <strong>Blocked:</strong> {p.blocked_reason}
            </Alert>
          )}
          {unpaid.length > 0 && (
            <Alert tone="warning">
              <strong>
                {unpaid.length} unpaid order{unpaid.length === 1 ? "" : "s"}
              </strong>
              , {formatMoney(unpaid.reduce((s, o) => s + Number(o.total_price), 0))} outstanding.
            </Alert>
          )}

          <section>
            <h3 className="ui-section ui-section--sub ui-section--first">Recent orders</h3>
            {orders.length === 0 ? (
              <p className="ui-hint">No orders yet.</p>
            ) : (
              <ul className="cust-orders">
                {orders.slice(0, MAX_ORDERS).map((o) => (
                  <li key={o.id} className="cust-order">
                    <div>
                      <b>{o.id}</b>
                      <div className="ui-cell__meta">
                        {formatDate(o.created_at)} · <span className="cust-order__meal">{o.meal_time}</span>
                      </div>
                    </div>
                    <span className="cust-order__total">{formatMoney(Number(o.total_price))}</span>
                    <OrderTrack status={o.status} />
                    <span className="cust-order__pay">
                      <PaymentMark status={o.payment_status} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {orders.length > MAX_ORDERS && <p className="ui-hint">Showing the {MAX_ORDERS} most recent of {orders.length} orders.</p>}
          </section>

          <section>
            <h3 className="ui-section ui-section--sub ui-section--first">Status history</h3>
            {log.length === 0 ? (
              <p className="ui-hint">No changes recorded.</p>
            ) : (
              <ol className="cust-timeline">
                {log.map((l) => {
                  const tone = l.new_status === "pending" ? "warn" : ["rejected", "disabled", "blocked"].includes(l.new_status) ? "bad" : "";
                  const detail = [l.previous_status ? `From ${labelOf(l.previous_status).toLowerCase()}` : null, l.reason, formatDateTime(l.created_at)].filter(Boolean).join(" · ");
                  return (
                    <li key={l.id}>
                      <i className={`cust-timeline__pt${tone ? ` cust-timeline__pt--${tone}` : ""}`} aria-hidden="true" />
                      <div>
                        <div className="cust-timeline__title">{labelOf(l.new_status)}</div>
                        <div className="ui-cell__meta">{detail}</div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </>
      )}
    </Drawer>
  );
}
