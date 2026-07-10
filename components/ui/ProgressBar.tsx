"use client";

/**
 * components/ui/ProgressBar.tsx
 * Clamped progress bar built on lib/ui/layout-math#progressWidth.
 * (Req 5.3, 12.4)
 */

import { progressWidth } from "@/lib/ui/layout-math";

export interface ProgressBarProps {
  /** Playback position in seconds (or any consistent unit with `duration`). */
  position: number;
  /** Total duration in the same unit as `position`. */
  duration: number;
  className?: string;
  "aria-label"?: string;
}

export function ProgressBar({ position, duration, className = "", ...props }: ProgressBarProps) {
  const ratio = progressWidth(position, duration);
  const percent = Math.round(ratio * 100);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={props["aria-label"] ?? "Watch progress"}
      className={["h-1 w-full overflow-hidden rounded-full bg-[color:var(--color-surface-4)]", className].join(" ")}
    >
      <div
        className="h-full rounded-full bg-[color:var(--color-brand)] transition-[width] duration-300 [transition-timing-function:var(--ease-out)]"
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
