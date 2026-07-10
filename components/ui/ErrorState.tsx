"use client";

/**
 * components/ui/ErrorState.tsx
 * Centered error state: sanitized message (<=120 chars) + Retry with a
 * loading indicator while retrying. (Req 19.2, 19.3, 20.1)
 */

import { AlertTriangle, Loader2 } from "lucide-react";
import { sanitizeErrorMessage } from "@/lib/ui/format";
import { Button } from "./Button";

export interface ErrorStateProps {
  message?: string | null;
  onRetry: () => void;
  retrying?: boolean;
  className?: string;
}

export function ErrorState({ message, onRetry, retrying = false, className = "" }: ErrorStateProps) {
  const safeMessage = sanitizeErrorMessage(message);

  return (
    <div
      className={[
        "relative flex flex-col items-center gap-4 overflow-hidden rounded-[var(--radius-lg)] px-6 py-16 text-center",
        className,
      ].join(" ")}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--color-brand)_0%,transparent_60%)] opacity-[0.08]"
      />
      <AlertTriangle aria-hidden="true" className="relative h-10 w-10 text-[color:var(--color-error)]" />
      <p className="relative max-w-sm text-body text-[color:var(--color-text-secondary)]">{safeMessage}</p>
      <Button variant="surface" pill className="relative mt-2" onClick={onRetry} disabled={retrying}>
        {retrying ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
        {retrying ? "Retrying…" : "Retry"}
      </Button>
    </div>
  );
}
