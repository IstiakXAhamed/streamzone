"use client";

/**
 * components/ui/Sheet.tsx
 * Bottom sheet for mobile / collapsible-panel breakpoints. Composes
 * FocusTrap; role="dialog", aria-modal, aria-labelledby.
 * (Req 8.1, 13.5)
 */

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { FocusTrap } from "@/components/layout/FocusTrap";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  heightVh?: number;
  children: ReactNode;
  className?: string;
}

export function Sheet({ open, onClose, labelledBy, heightVh = 50, children, className = "" }: SheetProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70]">
          <motion.div
            aria-hidden="true"
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
              initial={{ y: "100%" }}
              animate={{ y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } }}
              exit={{ y: "100%", transition: { duration: 0.15 } }}
              style={{ height: `${heightVh}vh` }}
              className={[
                "absolute inset-x-0 bottom-0 overflow-y-auto rounded-t-[var(--radius-xl)] bg-[color:var(--color-surface-2)] p-6 shadow-[var(--shadow-elevation-3)]",
                className,
              ].join(" ")}
            >
              <div aria-hidden="true" className="mx-auto mb-4 h-1 w-10 rounded-full bg-[color:var(--color-border-strong)]" />
              {children}
            </motion.div>
          </FocusTrap>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
