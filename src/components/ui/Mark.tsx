import type { ReactNode } from "react";

interface MarkProps {
  tone: "leaf" | "turmeric" | "brick" | "mist" | "ring"; // leaf = fine, turmeric = needs a human, brick = wrong, mist = off, ring = waiting
  children: ReactNode;
}

/** A state as a dot and a word (Active, Veg). The word always carries the meaning; the dot is decoration. */
export function Mark({ tone, children }: MarkProps) {
  return (
    <span className="ui-mark">
      <i className={`ui-mark__dot ui-mark__dot--${tone}`} aria-hidden="true" />
      {children}
    </span>
  );
}
