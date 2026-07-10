"use client";

/**
 * app/(site)/movie/[slug]/_components/MovieDetailContent.tsx
 * Rebuild: Backdrop parallax; two-column grid >=640px collapsing to
 * centered single column; poster 2:3, formatted duration/rating, genre
 * pill links; pill action buttons (Play brand-fill, others surface-3)
 * with scale pulse; "More Like This" carousel via relatedMovies (<=20);
 * staggered entry (50ms, <=400ms); non-critical section unmounts on failure.
 * (Req 6.1-6.7, 19.4)
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { Download, Play, Star, Users } from "lucide-react";
import { Backdrop } from "@/components/hero/Backdrop";
import { Media } from "@/components/ui/Media";
import { CarouselRow } from "@/components/carousel/CarouselRow";
import type { MovieCardData } from "@/components/home/MovieCard";
import { formatDuration, formatRating } from "@/lib/ui/format";
import { fadeUp } from "@/lib/motion/variants";
import { staggerDelays } from "@/lib/ui/layout-math";
import { SaveButton } from "./SaveButton";

interface Movie {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  year: number | null;
  duration_seconds: number | null;
  genre: string[];
  poster_url: string | null;
  backdrop_url: string | null;
  rating: number | null;
  trailer_drive_file_id: string | null;
}

const ACTION_BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-150 [transition-timing-function:var(--ease-out)]";

export function MovieDetailContent({ movie, related }: { movie: Movie; related: MovieCardData[] }) {
  const duration = movie.duration_seconds != null ? formatDuration(movie.duration_seconds) : null;

  // Stagger poster, title, meta, genres, buttons, description (6 elements) at 50ms/step.
  const delays = staggerDelays(6, 50, 6);

  return (
    <article>
      <div className="relative">
        <Backdrop backdropUrl={movie.backdrop_url} posterUrl={movie.poster_url} alt="" className="-mb-24 sm:-mb-32" />

        <section className="relative mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pt-0 sm:grid-cols-[220px_1fr] sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: delays[0] / 1000, duration: 0.3, ease: [0, 0, 0.2, 1] }}
            className="mx-auto w-40 sm:mx-0 sm:w-full"
          >
            <Media src={movie.poster_url} alt={movie.title} ratio="2/3" containerClassName="rounded-2xl" sizes="220px" />
          </motion.div>

          <div className="space-y-4 text-center sm:text-left">
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: delays[1] / 1000, duration: 0.3, ease: [0, 0, 0.2, 1] }}
              className="text-heading"
              style={{ fontSize: "clamp(30px, 5vw, 40px)" }}
            >
              {movie.title}
            </motion.h1>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: delays[2] / 1000, duration: 0.3, ease: [0, 0, 0.2, 1] }}
              className="flex flex-wrap items-center justify-center gap-2 text-sm text-[color:var(--color-text-secondary)] sm:justify-start"
            >
              {movie.year ? <span>{movie.year}</span> : null}
              {duration ? <span>· {duration}</span> : null}
              {movie.rating != null ? (
                <span className="flex items-center gap-1">
                  · <Star aria-hidden="true" className="h-4 w-4 fill-current text-[color:var(--color-warning)]" />
                  {formatRating(movie.rating)}
                </span>
              ) : null}
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: delays[3] / 1000, duration: 0.3, ease: [0, 0, 0.2, 1] }}
              className="flex flex-wrap justify-center gap-2 sm:justify-start"
            >
              {movie.genre.map((g) => (
                <Link
                  key={g}
                  href={`/category/${g.toLowerCase()}`}
                  className="rounded-full border border-[color:var(--color-border-strong)] bg-white/5 px-3 py-0.5 text-xs text-[color:var(--color-text-secondary)] hover:text-white"
                >
                  {g}
                </Link>
              ))}
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: delays[4] / 1000, duration: 0.3, ease: [0, 0, 0.2, 1] }}
              className="flex flex-wrap justify-center gap-2 sm:justify-start"
            >
              <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.15 }}>
                <Link
                  href={`/watch/${movie.id}`}
                  className={[ACTION_BUTTON_CLASS, "bg-[color:var(--color-brand)] text-[color:var(--color-brand-contrast)] hover:brightness-110"].join(" ")}
                >
                  <Play aria-hidden="true" className="h-4 w-4 fill-current" />
                  Play
                </Link>
              </motion.div>
              <SaveButton movieId={movie.id} title={movie.title} />
              <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.15 }}>
                <a
                  href={`https://drive.google.com/uc?export=download&id=${movie.trailer_drive_file_id ?? ""}`}
                  className={[ACTION_BUTTON_CLASS, "bg-[color:var(--color-surface-3)] text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-4)]"].join(" ")}
                >
                  <Download aria-hidden="true" className="h-4 w-4" />
                  Download
                </a>
              </motion.div>
              <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.15 }}>
                <Link
                  href="/party/create"
                  className={[ACTION_BUTTON_CLASS, "bg-[color:var(--color-surface-3)] text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-4)]"].join(" ")}
                >
                  <Users aria-hidden="true" className="h-4 w-4" />
                  Watch Party
                </Link>
              </motion.div>
            </motion.div>

            {movie.description ? (
              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: delays[5] / 1000, duration: 0.3, ease: [0, 0, 0.2, 1] }}
                className="mx-auto max-w-prose text-sm text-[color:var(--color-text-secondary)] sm:mx-0"
              >
                {movie.description}
              </motion.p>
            ) : null}
          </div>
        </section>
      </div>

      {related.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <CarouselRow title="More Like This" movies={related.slice(0, 20)} />
        </section>
      ) : null}
    </article>
  );
}
