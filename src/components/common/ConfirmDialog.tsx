import Modal from "./Modal";
import { Button } from "../ui";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "danger" | "primary"; // danger for destructive actions, primary for ordinary confirmations
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", tone = "danger", onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="modal__body">{message}</p>
      <div className="modal__actions">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant={tone} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
