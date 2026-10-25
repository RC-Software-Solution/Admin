import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { LuX } from "react-icons/lu";

interface DrawerProps {
  open: boolean;
  label: string; // names the panel for screen readers
  onClose: () => void;
  children: ReactNode;
}

/** A panel that slides in from the right (a profile, a detail view). Native <dialog>: focus trap, Esc and the backdrop come free. */
export function Drawer({ open, label, onClose, children }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="ui-drawer"
      aria-label={label}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()} // a click on the backdrop lands on the dialog element itself
    >
      {open && (
        <div className="ui-drawer__inner">
          <button type="button" className="ui-drawer__close" aria-label="Close" onClick={onClose}>
            <LuX aria-hidden="true" />
          </button>
          {children}
        </div>
      )}
    </dialog>
  );
}
