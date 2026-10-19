import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`modal${wide ? " modal--wide" : ""}`}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()} // click on the backdrop
    >
      {open && (
        <>
          <h2 className="modal__title">{title}</h2>
          {children}
        </>
      )}
    </dialog>
  );
}
