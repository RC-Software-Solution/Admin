import { useRef, useState } from "react";
import { MdNotificationsNone } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAttention } from "../../hooks/useAttention";
import { useDismiss } from "../../hooks/useDismiss";

const ROWS = [
  { key: "pendingApprovals", one: "customer awaiting approval", many: "customers awaiting approval", to: "/users?tab=pending" },
  { key: "unpaidOrders", one: "unpaid order", many: "unpaid orders", to: "/orders?payment_status=unpaid" },
  { key: "failedDeliveries", one: "failed delivery", many: "failed deliveries", to: "/orders?status=delivery_failed" },
  { key: "blockedUsers", one: "blocked customer", many: "blocked customers", to: "/users?tab=blocked" },
] as const;

/** Top-bar bell: live counts of what needs an admin's attention, each linking to the page that handles it. */
export default function Bell() {
  const { data, error, badge } = useAttention();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useDismiss(open, box, () => setOpen(false));

  return (
    <div className="bell" ref={box}>
      <button className="iconBtn" aria-label={badge > 0 ? `${badge} items need attention` : "Notifications"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <MdNotificationsNone aria-hidden="true" />
        {badge > 0 && <span className="notification-badge">{badge > 99 ? "99+" : badge}</span>}
      </button>
      {open && (
        <div className="bell__panel" role="menu">
          <div className="bell__title">Needs attention</div>
          {!data && <div className="bell__note">{error ? `Couldn't load: ${error}` : "Loading…"}</div>}
          {data && badge === 0 && <div className="bell__note">Nothing needs attention right now.</div>}
          {data && ROWS.map((r) => {
            const n = data[r.key];
            if (n === 0) return null;
            return (
              <button key={r.key} className="bell__row" role="menuitem" onClick={() => { setOpen(false); navigate(r.to); }}>
                <strong>{n ?? "—"}</strong> {n === 1 ? r.one : r.many}{n === null && " (unavailable)"}
              </button>
            );
          })}
          {data && error && <div className="bell__note">Showing the last loaded counts (refresh failed).</div>}
        </div>
      )}
    </div>
  );
}
