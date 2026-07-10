"use client";

/**
 * components/ui/Modal.tsx
 * Modal/Dialog composing FocusTrap. role="dialog", aria-modal, aria-labelledby.
 * Backdrop-blur. Open: backdrop 0->target 200ms, content 0.95->1 spring.
 * Close: 150ms. (Req 8.1, 12.7, 13.4, 14.3, 14.4, 16.4)
 */

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { FocusTrap } from "@/components/layout/FocusTrap";
import { modalContent } from "@/lib/motion/variants";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  danger?: boolean;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, labelledBy, danger = false, children, className = "" }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
          <motion.div
            aria-hidden="true"
            data-testid="modal-backdrop"
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            onClick={onClose}
          />
          <FocusTrap active={open} onClose={onClose}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={labelledBy}
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={[
                "relative w-full max-w-md rounded-[var(--radius-lg)] bg-[color:var(--color-surface-2)] p-6 shadow-[var(--shadow-elevation-3)]",
                danger ? "border border-[color:var(--color-error)]/30" : "",
                className,
              ].join(" ")}
            >
              {children}
            </motion.div>
          </FocusTrap>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
