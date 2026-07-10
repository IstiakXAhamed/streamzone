/**
 * components/admin/StatCard.tsx
 * Stat cards with gradient backgrounds (brand-adjacent 10% opacity),
 * trend indicators (up/down arrow + percentage), icon accent per metric.
 * (Req 13.2)
 */

import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: number | string;
  Icon: LucideIcon;
  accentClassName?: string;
  trendPercent?: number; // positive = up (green), negative = down (red)
}

export function StatCard({ label, value, Icon, accentClassName = "text-[color:var(--color-brand)]", trendPercent }: StatCardProps) {
  const hasTrend = typeof trendPercent === "number";
  const isPositive = (trendPercent ?? 0) >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-2)]/60 p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,var(--color-brand)_0%,transparent_70%)] opacity-10"
      />
      <div className="relative flex items-center justify-between">
        <Icon aria-hidden="true" size={20} className={accentClassName} />
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <div className="relative mt-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-[color:var(--color-text-tertiary)]">{label}</p>
        {hasTrend ? (
          <span
            className={[
              "flex items-center gap-0.5 text-xs font-semibold",
              isPositive ? "text-[color:var(--color-success)]" : "text-[color:var(--color-error)]",
            ].join(" ")}
          >
            {isPositive ? <TrendingUp aria-hidden="true" size={12} /> : <TrendingDown aria-hidden="true" size={12} />}
            {Math.abs(trendPercent!).toFixed(0)}%
          </span>
        ) : null}
      </div>
    </div>
  );
}
