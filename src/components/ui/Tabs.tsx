import { useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

interface TabsProps<T extends string> {
  label: string; // names the tab list for screen readers
  value: T;
  tabs: { value: T; label: string }[];
  onChange: (v: T) => void;
  children: ReactNode; // the panel for the selected tab
}

/** Switches between views of the same data (the three reports). Chips filter a list; Segmented picks a range; Tabs change the view. */
export function Tabs<T extends string>({ label, value, tabs, onChange, children }: TabsProps<T>) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (e: KeyboardEvent, i: number) => {
    const n = tabs.length;
    const to = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    onChange(tabs[to].value);
    refs.current[to]?.focus();
  };

  return (
    <>
      <div className="ui-tabs" role="tablist" aria-label={label}>
        {tabs.map((t, i) => (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${id}-${t.value}`}
            type="button"
            role="tab"
            className="ui-tab"
            aria-selected={t.value === value}
            aria-controls={`${id}-panel`}
            tabIndex={t.value === value ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => move(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${value}`} tabIndex={0}>
        {children}
      </div>
    </>
  );
}
