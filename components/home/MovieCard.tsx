"use client";

/**
 * components/home/MovieCard.tsx
 * Rebuilt MovieCard: desktop hover scale 1.05 + elevation + overlay
 * (title/year/rating/Play, 200ms ease-out); mobile long-press >=300ms
 * context menu (Play/Watchlist/Download/Share) with pre-threshold release
 * navigating; press scale 0.97 then navigate; lazy poster via Media
 * (fade-in + fallback); optional progress bar via progressWidth.
 * (Req 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7)
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Play, Share2, Star, ListPlus } from "lucide-react";
import { Media } from "@/components/ui/Media";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatRating } from "@/lib/ui/format";

export interface MovieCardData {
  id: string;
  title: string;
  slug: string;
  year?: number | null;
  rating?: number | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  duration_seconds?: number | null;
  /** Watch-history position in seconds, for the progress bar (Req 5.3). */
  watch_position_seconds?: number | null;
}

const LONG_PRESS_MS = 300;

export interface MovieCardMenuAction {
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  onSelect: () => void;
}

export function MovieCard({ movie }: { movie: MovieCardData }) {
  const router = useRouter();
  const href = `/movie/${movie.slug}`;
  const [pressed, setPressed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const progressRatio =
    movie.watch_position_seconds && movie.duration_seconds
      ? movie.watch_position_seconds / movie.duration_seconds
      : null;

  function clearLongPressTimer() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleTouchStart() {
    longPressTriggered.current = false;
    setPressed(true);
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setMenuOpen(true);
    }, LONG_PRESS_MS);
  }

  function handleTouchEnd() {
    setPressed(false);
    clearLongPressTimer();
    if (!longPressTriggered.current) {
      router.push(href);
    }
  }

  function handleTouchCancel() {
    setPressed(false);
    clearLongPressTimer();
  }

  const menuActions: MovieCardMenuAction[] = [
    { label: "Play", icon: Play, onSelect: () => router.push(href) },
    { label: "Add to Watchlist", icon: ListPlus, onSelect: () => setMenuOpen(false) },
    { label: "Download", icon: Download, onSelect: () => setMenuOpen(false) },
    { label: "Share", icon: Share2, onSelect: () => setMenuOpen(false) },
  ];

  return (
    <div className="relative flex w-36 shrink-0 flex-col gap-1 sm:w-44">
      <motion.div
        whileHover={{ scale: 1.05, transition: { duration: 0.2, ease: [0, 0, 0.2, 1] } }}
        animate={pressed ? { scale: 0.97 } : { scale: 1 }}
        transition={{ duration: 0.1, ease: [0, 0, 0.2, 1] }}
        className="group relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <Link
          href={href}
          onClick={(e) => {
            // Touch devices handle navigation manually via handleTouchEnd
            // so the long-press gesture can intercept it.
            if (longPressTriggered.current) e.preventDefault();
          }}
          className="relative block overflow-hidden rounded-xl shadow-[var(--shadow-elevation-1)] transition-shadow duration-200 group-hover:shadow-[var(--shadow-elevation-2)]"
        >
          <Media src={movie.poster_url} alt={movie.title} ratio="2/3" sizes="(max-width: 640px) 144px, 176px" />

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end gap-1 bg-gradient-to-t from-black/85 via-black/10 to-transparent p-3 opacity-0 transition-opacity duration-200 [transition-timing-function:var(--ease-out)] group-hover:opacity-100">
            <p className="line-clamp-1 text-sm font-semibold text-white">{movie.title}</p>
            <p className="flex items-center gap-2 text-xs text-white/80">
              <span>{movie.year ?? "—"}</span>
              {movie.rating != null ? (
                <span className="flex items-center gap-1">
                  <Star aria-hidden="true" className="h-3 w-3 fill-current text-[color:var(--color-warning)]" />
                  {formatRating(movie.rating)}
                </span>
              ) : null}
            </p>
            <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-[color:var(--color-brand)] px-2.5 py-1 text-xs font-semibold text-white">
              <Play aria-hidden="true" className="h-3 w-3 fill-current" />
              Play
            </span>
          </div>

          {progressRatio != null ? (
            <div className="absolute inset-x-0 bottom-0 p-1.5">
              <ProgressBar
                position={movie.watch_position_seconds ?? 0}
                duration={movie.duration_seconds ?? 0}
                aria-label={`${movie.title} watch progress`}
              />
            </div>
          ) : null}
        </Link>
      </motion.div>

      <p className="line-clamp-1 text-sm font-medium">{movie.title}</p>
      <p className="text-xs text-[color:var(--color-text-tertiary)]">
        {movie.year ?? "—"} · {movie.rating != null ? `${formatRating(movie.rating)}★` : "unrated"}
      </p>

      {menuOpen ? (
        <div
          role="menu"
          aria-label={`${movie.title} actions`}
          className="absolute inset-x-0 top-0 z-20 flex flex-col overflow-hidden rounded-xl bg-[color:var(--color-surface-3)] shadow-[var(--shadow-elevation-2)]"
        >
          {menuActions.map((action) => (
            <button
              key={action.label}
              role="menuitem"
              type="button"
              onClick={() => {
                action.onSelect();
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-3 text-left text-sm text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-4)]"
            >
              <action.icon aria-hidden className="h-4 w-4" />
              {action.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="border-t border-[color:var(--color-border-subtle)] px-4 py-2 text-center text-xs text-[color:var(--color-text-tertiary)]"
          >
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function MovieCardSkeleton() {
  return (
    <div className="flex w-36 shrink-0 flex-col gap-2 sm:w-44">
      <div className="aspect-[2/3] rounded-xl mz-shimmer" />
      <div className="h-3 w-3/4 rounded-full mz-shimmer" />
      <div className="h-2 w-1/2 rounded-full mz-shimmer" />
    </div>
  );
}
