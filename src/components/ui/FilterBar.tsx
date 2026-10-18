import type { ReactNode } from "react";

export function FilterBar({ label = "Filters", children }: { label?: string; children: ReactNode }) {
  return (
    <div className="ui-filterbar" role="group" aria-label={label}>
      {children}
    </div>
  );
}
