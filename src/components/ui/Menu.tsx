import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { LuEllipsis } from "react-icons/lu";
import { useDismiss } from "../../hooks/useDismiss";

export interface MenuItem {
  label: string;
  onSelect: () => void;
  tone?: "danger";
}

interface MenuProps {
  label: string; // accessible name of the "..." button
  items: MenuItem[];
}

interface Position {
  top?: number;
  bottom?: number;
  right: number;
}

const ROW_PX = 40; // estimated height of one item, used to decide whether to open upwards

/** A "..." button with a short list of actions. The panel is position: fixed so a scrolling table cannot clip it. */
export function Menu({ label, items }: MenuProps) {
  const [pos, setPos] = useState<Position | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setPos(null), []);
  useDismiss(pos !== null, box, close);

  // A fixed panel does not follow its row, so close it when the page scrolls or resizes.
  useEffect(() => {
    if (!pos) return;
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [pos, close]);

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    if (pos) return close();
    const r = e.currentTarget.getBoundingClientRect();
    const right = window.innerWidth - r.right;
    const needed = items.length * ROW_PX + 16;
    setPos(r.bottom + needed > window.innerHeight ? { bottom: window.innerHeight - r.top + 4, right } : { top: r.bottom + 4, right });
  };

  if (items.length === 0) return null;
  return (
    <div className="ui-menu" ref={box}>
      <button type="button" className="ui-menu__trigger" aria-label={label} aria-expanded={pos !== null} onClick={toggle}>
        <LuEllipsis aria-hidden="true" />
      </button>
      {pos && (
        <div className="ui-menu__panel" style={pos}>
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              className={`ui-menu__item${it.tone ? ` ui-menu__item--${it.tone}` : ""}`}
              onClick={() => {
                close();
                it.onSelect();
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
