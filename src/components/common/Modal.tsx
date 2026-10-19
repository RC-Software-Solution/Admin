import { useEffect, useId, useRef } from "react";
import "./modal.css";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}

// Native <dialog>: the browser gives us focus trapping, Esc to close and the backdrop.
export default function Modal({ open, title, onClose, wide = false, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      d.scrollTop = 0; // showModal focuses the last-reachable control; keep the title in view
    }
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`modal${wide ? " modal--wide" : ""}`}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()} // click on the backdrop
    >
      {open && (
        <>
          <h2 id={titleId} className="modal__title">{title}</h2>
          {children}
        </>
      )}
    </dialog>
  );
}
