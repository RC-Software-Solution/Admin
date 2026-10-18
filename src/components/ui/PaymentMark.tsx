import type { PaymentStatus } from "../../types/orders";

const LABEL: Record<PaymentStatus, string> = { paid: "Paid", unpaid: "Unpaid", pending: "Pending", ignored: "Ignored" };

/** Payment state as a dot and a word. Unpaid is the one that stands out. */
export function PaymentMark({ status }: { status: PaymentStatus }) {
  return (
    <span className={`ui-pay ui-pay--${status}`}>
      <i className="ui-pay__dot" aria-hidden="true" />
      {LABEL[status]}
    </span>
  );
}
