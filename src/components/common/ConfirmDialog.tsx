import Modal from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="modal__body">{message}</p>
      <div className="modal__actions">
        <button type="button" className="modal__btn" onClick={onCancel}>Cancel</button>
        <button type="button" className="modal__btn modal__btn--danger" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
