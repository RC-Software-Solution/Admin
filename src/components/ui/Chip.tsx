import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  count?: number;
  attention?: boolean; // turmeric when selected: a filter that means "needs a human"
}

/** A one-click filter. Exposes its state as aria-pressed. */
export function Chip({ selected = false, count, attention = false, className, children, type = "button", ...rest }: ChipProps) {
  return (
    <button type={type} aria-pressed={selected} className={["ui-chip", attention && "ui-chip--attn", className].filter(Boolean).join(" ")} {...rest}>
      {children}
      {count !== undefined && <span className="ui-chip__count">{count}</span>}
    </button>
  );
}

export function Chips({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ui-chips" role="group" aria-label={label}>
      {children}
    </div>
  );
}
