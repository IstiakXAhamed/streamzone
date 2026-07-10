"use client";

/**
 * components/ui/Toast.tsx
 * Toast + ToastProvider. Backed by lib/ui/toast-stack.ts (max 3, evict
 * oldest). Slide-in-from-top <=300ms, auto-dismiss 3s, aria-live region.
 * (Req 16.3, 19.5, 20.2)
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";
import { pushToast, dismissToast, type Toast as ToastData } from "@/lib/ui/toast-stack";

const AUTO_DISMISS_MS = 3000;

interface ToastContextValue {
  push: (toast: Omit<ToastData, "id" | "createdAt">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

const KIND_ICON: Record<ToastData["kind"], typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
};

const KIND_COLOR: Record<ToastData["kind"], string> = {
  info: "text-[color:var(--color-info)]",
  success: "text-[color:var(--color-success)]",
  error: "text-[color:var(--color-error)]",
};

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `toast-${Date.now()}-${idCounter}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((stack) => dismissToast(stack, id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (toast: Omit<ToastData, "id" | "createdAt">) => {
      const id = nextId();
      const full: ToastData = { ...toast, id, createdAt: Date.now() };
      setToasts((stack) => pushToast(stack, full));
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = KIND_ICON[toast.kind];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
                role="status"
                className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-[var(--radius-md)] bg-[color:var(--color-surface-3)] px-4 py-3 shadow-[var(--shadow-elevation-2)]"
              >
                <Icon aria-hidden="true" className={["h-5 w-5 shrink-0", KIND_COLOR[toast.kind]].join(" ")} />
                <p className="text-sm text-[color:var(--color-text-primary)]">{toast.message}</p>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(toast.id)}
                  className="ml-auto shrink-0 rounded-full p-1 text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text-primary)]"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
