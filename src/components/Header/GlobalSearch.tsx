import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalSearch } from "../../hooks/useGlobalSearch";
import { useDismiss } from "../../hooks/useDismiss";
import { statusOf } from "../../types/users";

/** Top-bar search: jump straight to a customer (name, email, phone) or an order (id). */
export default function GlobalSearch() {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const s = useGlobalSearch(text, open);

  useDismiss(open, box, () => setOpen(false));

  const go = (to: string) => {
    setOpen(false);
    setText("");
    navigate(to);
  };
  const empty = s.settled && s.customers.length === 0 && s.orders.length === 0;

  return (
    <div className="searchWrap" ref={box}>
      <input
        className="topbar__search"
        type="search"
        placeholder="Find a customer or order id"
        aria-label="Search customers and orders"
        value={text}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setText(e.target.value); setOpen(true); }}
      />
      {open && s.ready && (
        <div className="searchResults" role="listbox">
          {s.customers.length > 0 && <div className="searchResults__group">Customers</div>}
          {s.customers.map((c) => (
            <button key={c.id} className="searchResults__item" role="option" onClick={() => go(`/users?tab=${statusOf(c)}&q=${encodeURIComponent(c.email)}`)}>
              {c.full_name} <span>{c.email} · {statusOf(c)}</span>
            </button>
          ))}
          {s.orders.length > 0 && <div className="searchResults__group">Orders</div>}
          {s.orders.map((o) => (
            <button key={o.id} className="searchResults__item" role="option" onClick={() => go(`/orders?q=${encodeURIComponent(o.id)}`)}>
              {o.id} <span>{o.customer_name ?? "customer"} · {o.status.replace("_", " ")} · {o.payment_status}</span>
            </button>
          ))}
          {empty && <div className="searchResults__note">No customer or order matches “{text.trim()}”.</div>}
          {!s.settled && !s.error && <div className="searchResults__note">Searching…</div>}
          {s.error && <div className="searchResults__note">Search is unavailable: {s.error}</div>}
        </div>
      )}
    </div>
  );
}
