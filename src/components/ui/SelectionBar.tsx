import type { ReactNode } from "react";

/** Floats at the bottom of the screen while rows are selected; put the count and the action inside. */
export function SelectionBar({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ui-selbar" role="region" aria-label={label}>
      {children}
    </div>
  );
}
