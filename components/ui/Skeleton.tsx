/**
 * components/ui/Skeleton.tsx
 * Shimmer skeleton loader matching content dimensions. Appears
 * immediately (no artificial delay) and respects reduced motion via the
 * global .mz-shimmer CSS guard in app/globals.css. (Req 5.3, 12.4, 20.4)
 */

export interface SkeletonProps {
  className?: string;
  /** Explicit width/height when not controlled purely by className. */
  width?: number | string;
  height?: number | string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}

const ROUNDED_CLASSES: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  sm: "rounded-[var(--radius-sm)]",
  md: "rounded-[var(--radius-md)]",
  lg: "rounded-[var(--radius-lg)]",
  xl: "rounded-[var(--radius-xl)]",
  full: "rounded-full",
};

export function Skeleton({ className = "", width, height, rounded = "md" }: SkeletonProps) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={["mz-shimmer", ROUNDED_CLASSES[rounded], className].join(" ")}
      style={{ width, height }}
    />
  );
}
