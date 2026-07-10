/**
 * components/ui/EmptyState.tsx
 * Illustration + copy + single CTA. Brand gradient-mesh background
 * (0.03-0.15 opacity). (Req 19.1, 20.1)
 */

import Link from "next/link";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  illustration: ReactNode;
  title: string;
  body: string;
  cta?: { label: string; href: string };
  className?: string;
}

export function EmptyState({ illustration, title, body, cta, className = "" }: EmptyStateProps) {
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
      <div className="relative text-[color:var(--color-text-tertiary)]">{illustration}</div>
      <h3 className="relative text-title">{title}</h3>
      <p className="relative max-w-sm text-body text-[color:var(--color-text-secondary)]">{body}</p>
      {cta ? (
        <Link
          href={cta.href}
          className="relative mt-2 inline-flex h-10 items-center justify-center rounded-full bg-[color:var(--color-brand)] px-5 text-sm font-medium text-[color:var(--color-brand-contrast)] transition-colors duration-150 [transition-timing-function:var(--ease-out)] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-brand)]"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
