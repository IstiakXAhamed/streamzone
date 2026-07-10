/**
 * components/ui/Card.tsx
 * Elevation-token-driven Card surface.
 * (Req 20.4 elevation tokens)
 */

import type { HTMLAttributes } from "react";

export type CardElevation = 1 | 2 | 3 | 4;

const ELEVATION_STYLE: Record<CardElevation, string> = {
  1: "var(--shadow-elevation-1)",
  2: "var(--shadow-elevation-2)",
  3: "var(--shadow-elevation-3)",
  4: "var(--shadow-elevation-4)",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: CardElevation;
}

export function Card({ elevation = 1, className = "", style, children, ...props }: CardProps) {
  return (
    <div
      className={["rounded-[var(--radius-md)] bg-[color:var(--color-surface-2)]", className].join(" ")}
      style={{ boxShadow: ELEVATION_STYLE[elevation], ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
