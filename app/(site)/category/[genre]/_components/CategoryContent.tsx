"use client";

/**
 * app/(site)/category/[genre]/_components/CategoryContent.tsx
 * Header (display-type genre name, <=10% genre gradient accent, count
 * badge); responsive grid via gridColumnsForWidth (16px gap);
 * SegmentedControl sort (Trending default) via lib/ui/sort.ts; re-sort
 * with framer-motion layout (300ms); staggered entry 30ms/item capped 40;
 * empty state with genre name + home link.
 * (Req 7.1-7.7)
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MovieCard, type MovieCardData } from "@/components/home/MovieCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { sortMovies, type SortKey } from "@/lib/ui/sort";
import { staggerDelays } from "@/lib/ui/layout-math";

export interface CategoryMovie extends MovieCardData {
  views_count: number;
}

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "newest", label: "Newest" },
  { id: "highest-rated", label: "Highest Rated" },
  { id: "a-z", label: "A–Z" },
];

const STAGGER_STEP_MS = 30;
const STAGGER_CAP = 40;

export function CategoryContent({ genre, movies }: { genre: string; movies: CategoryMovie[] }) {
  const [sort, setSort] = useState<SortKey>("trending");

  const sorted = useMemo(() => sortMovies(movies, sort), [movies, sort]);
  const delays = staggerDelays(sorted.length, STAGGER_STEP_MS, STAGGER_CAP);

  const genreLabel = genre.charAt(0).toUpperCase() + genre.slice(1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative mb-6 overflow-hidden rounded-[var(--radius-lg)] p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,var(--color-brand)_0%,transparent_70%)] opacity-[0.08]"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-display">{genreLabel}</h1>
          <span className="rounded-full bg-[color:var(--color-surface-3)] px-3 py-1 text-sm font-semibold text-[color:var(--color-text-secondary)]">
            {movies.length} {movies.length === 1 ? "title" : "titles"}
          </span>
        </div>
      </div>

      {movies.length === 0 ? (
        <EmptyState
          illustration={<span className="text-5xl">🎬</span>}
          title={`No movies in ${genreLabel} yet`}
          body="Check back soon, or explore something else on the home page."
          cta={{ label: "Back to Home", href: "/" }}
        />
      ) : (
        <>
          <div className="mb-6">
            <SegmentedControl
              aria-label="Sort movies"
              options={SORT_OPTIONS}
              value={sort}
              onChange={(id) => setSort(id as SortKey)}
            />
          </div>

          <ul
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
            style={{ listStyle: "none" }}
          >
            {sorted.map((movie, i) => (
              <motion.li
                key={movie.id}
                layout
                layoutId={movie.id}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  layout: { duration: 0.3, ease: [0, 0, 0.2, 1] },
                  delay: delays[i] / 1000,
                  duration: 0.3,
                  ease: [0, 0, 0.2, 1],
                }}
              >
                <MovieCard movie={movie} />
              </motion.li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
