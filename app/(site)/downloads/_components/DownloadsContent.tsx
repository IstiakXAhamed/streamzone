"use client";

/**
 * app/(site)/downloads/_components/DownloadsContent.tsx
 * Rebuild: cards with 60x90 thumb, title, file size via formatFileSize,
 * 3-state action button (idle/spinner/checkmark); vertical list 12px gap
 * + dividers; empty state; recency grouping via groupByRecency when >10;
 * disabled state for expired links.
 * (Req 11.1-11.6, 19.1)
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Download as DownloadIcon, Loader2, HardDriveDownload } from "lucide-react";
import { Media } from "@/components/ui/Media";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatFileSize } from "@/lib/ui/format";
import { groupByRecency } from "@/lib/ui/search";

export interface DownloadItem {
  id: string;
  title: string;
  posterUrl: string | null;
  fileSizeMb: number | null;
  href: string | null; // null => unavailable/expired
  createdAt: string;
}

type ButtonState = "idle" | "active" | "complete";

const RECENCY_GROUPING_THRESHOLD = 10;

function DownloadCard({ item }: { item: DownloadItem }) {
  const [state, setState] = useState<ButtonState>("idle");
  const disabled = !item.href;

  function handleClick() {
    if (disabled || state !== "idle") return;
    setState("active");
    window.open(item.href!, "_blank", "noreferrer");
    setTimeout(() => setState("complete"), 1200);
    setTimeout(() => setState("idle"), 3200);
  }

  return (
    <li className="flex items-center gap-3 border-b border-[color:var(--color-border-subtle)] py-3 last:border-b-0">
      <div className="relative h-[90px] w-[60px] shrink-0 overflow-hidden rounded-md">
        <Media src={item.posterUrl} alt={item.title} fill sizes="60px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={["line-clamp-1 text-sm font-medium", disabled ? "text-[color:var(--color-text-tertiary)]" : ""].join(" ")}>
          {item.title}
        </p>
        <p className="text-xs text-[color:var(--color-text-tertiary)]">
          {disabled ? "Download no longer available" : item.fileSizeMb != null ? formatFileSize(item.fileSizeMb) : "Size unknown"}
        </p>
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={disabled ? `${item.title} unavailable` : `Download ${item.title}`}
        className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--color-surface-3)] text-[color:var(--color-text-primary)] disabled:opacity-40"
      >
        {state === "idle" ? <DownloadIcon aria-hidden="true" size={16} /> : null}
        {state === "active" ? <Loader2 aria-hidden="true" size={16} className="animate-spin" /> : null}
        {state === "complete" ? (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <Check aria-hidden="true" size={16} />
          </motion.span>
        ) : null}
      </button>
    </li>
  );
}

export function DownloadsContent({ items }: { items: DownloadItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        illustration={<HardDriveDownload aria-hidden="true" className="h-10 w-10" />}
        title="No downloads yet"
        body="Downloaded movies will appear here."
        cta={{ label: "Browse Movies", href: "/" }}
      />
    );
  }

  if (items.length <= RECENCY_GROUPING_THRESHOLD) {
    return <ul className="space-y-0">{items.map((item) => <DownloadCard key={item.id} item={item} />)}</ul>;
  }

  const groups = groupByRecency(items.map((i) => ({ ...i, timestamp: i.createdAt })));

  return (
    <div className="space-y-8">
      {groups.today.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-[color:var(--color-text-secondary)]">Today</h2>
          <ul className="space-y-0">{groups.today.map((item) => <DownloadCard key={item.id} item={item} />)}</ul>
        </section>
      ) : null}
      {groups.thisWeek.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-[color:var(--color-text-secondary)]">This Week</h2>
          <ul className="space-y-0">{groups.thisWeek.map((item) => <DownloadCard key={item.id} item={item} />)}</ul>
        </section>
      ) : null}
      {groups.earlier.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-[color:var(--color-text-secondary)]">Earlier</h2>
          <ul className="space-y-0">{groups.earlier.map((item) => <DownloadCard key={item.id} item={item} />)}</ul>
        </section>
      ) : null}
    </div>
  );
}
