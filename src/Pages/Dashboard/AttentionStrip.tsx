import { Link } from "react-router-dom";
import { useAttention } from "../../hooks/useAttention";

interface Cell {
  key: "pendingApprovals" | "unpaidOrders" | "failedDeliveries";
  tone: "hot" | "bad"; // turmeric asks for action, brick means something failed
  noun: [one: string, many: string];
  action: string;
  to: string;
}

const CELLS: Cell[] = [
  { key: "pendingApprovals", tone: "hot", noun: ["customer waiting for approval", "customers waiting for approval"], action: "Review customers", to: "/users?tab=pending" },
  { key: "unpaidOrders", tone: "hot", noun: ["unpaid order", "unpaid orders"], action: "Chase payments", to: "/orders?payment_status=unpaid" },
  { key: "failedDeliveries", tone: "bad", noun: ["failed delivery to follow up", "failed deliveries to follow up"], action: "Open orders", to: "/orders?status=delivery_failed" },
];

/** What needs a human right now: the three counts the bell shows, each with a link to its list. */
export default function AttentionStrip() {
  const { data, error } = useAttention();
  return (
    <section className="dash-attention" aria-label="Needs attention">
      {CELLS.map((c) => {
        const n = data?.[c.key];
        const text = !data && !error ? "Loading…" : n === null || n === undefined ? "couldn't be loaded" : c.noun[n === 1 ? 0 : 1];
        return (
          <div key={c.key} className="dash-attention__cell">
            <span className={`dash-attention__big${n ? ` dash-attention__big--${c.tone}` : ""}`}>{n ?? "—"}</span>
            <p>{text}</p>
            {n ? (
              <Link className="ui-btn ui-btn--secondary ui-btn--sm" to={c.to}>
                {c.action}
              </Link>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
