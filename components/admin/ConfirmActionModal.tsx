"use client";

/**
 * components/admin/ConfirmActionModal.tsx
 * Destructive-action confirmation modal: warning message specifying the
 * affected item, danger confirm button, neutral cancel, backdrop-blur.
 * Escape/cancel dismiss without performing the action. (Req 13.4)
 */

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface ConfirmActionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemLabel: string;
  confirmLabel?: string;
  confirming?: boolean;
}

export function ConfirmActionModal({
  open,
  onClose,
  onConfirm,
  title,
  itemLabel,
  confirmLabel = "Delete",
  confirming = false,
}: ConfirmActionModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="confirm-action-title" danger>
      <h2 id="confirm-action-title" className="text-title">
        {title}
      </h2>
      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
        This will permanently affect <strong className="text-[color:var(--color-text-primary)]">{itemLabel}</strong>. This
        action cannot be undone.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="surface" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={confirming}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
