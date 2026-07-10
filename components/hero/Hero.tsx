"use client";

/**
 * components/hero/Hero.tsx
 * Home hero: 8s auto-advance (disabled under reduced motion), pause on
 * hover/touch/manual + resume after 15s idle, 500ms crossfade, swipe
 * (@use-gesture/react) + arrows, gradient overlay with title/year/rating/Play CTA.
 * (Req 4.1, 4.2, 4.3, 16.6)
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import { ChevronLeft, ChevronRight, Play, Star } from "lucide-react";
import { Media } from "@/components/ui/Media";
import { IconButton } from "@/components/ui/Button";
import { useAppReducedMotion } from "@/lib/motion/reduced-motion";
import { formatRating } from "@/lib/ui/format";

export interface HeroSlide {
  id: string;
  slug: string;
  title: string;
  year: number | null;
  rating: number | null;
  backdropUrl: string | null;
  posterUrl: string | null;
}

export interface HeroProps {
  slides: HeroSlide[];
  autoAdvanceMs?: number;
  resumeAfterIdleMs?: number;
}

const CROSSFADE_SECONDS = 0.5;

export function Hero({ slides, autoAdvanceMs = 8000, resumeAfterIdleMs = 15000 }: HeroProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useAppReducedMotion();
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  const pauseThenResume = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), resumeAfterIdleMs);
  }, [resumeAfterIdleMs]);

  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || paused || slides.length <= 1) return;
    const timer = setInterval(() => goTo(index + 1), autoAdvanceMs);
    return () => clearInterval(timer);
  }, [reducedMotion, paused, slides.length, index, autoAdvanceMs, goTo]);

  const bindDrag = useDrag(({ swipe: [swipeX] }) => {
    if (swipeX === -1) {
      pauseThenResume();
      goTo(index + 1);
    } else if (swipeX === 1) {
      pauseThenResume();
      goTo(index - 1);
    }
  });

  if (slides.length === 0) return null;

  const slide = slides[index];

  return (
    <div
      className="relative aspect-[16/7] w-full overflow-hidden rounded-2xl sm:aspect-[16/6]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      {...bindDrag()}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : CROSSFADE_SECONDS, ease: [0, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          <Media
            src={slide.backdropUrl ?? slide.posterUrl}
            alt={slide.title}
            fill
            preload={index === 0}
            containerClassName="absolute inset-0"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6 sm:p-10">
            <h2 className="line-clamp-2 text-heading drop-shadow">{slide.title}</h2>
            <p className="flex items-center gap-2 text-sm text-[color:var(--color-text-secondary)]">
              <span>{slide.year ?? "—"}</span>
              {slide.rating != null ? (
                <span className="flex items-center gap-1">
                  <Star aria-hidden="true" className="h-4 w-4 fill-current text-[color:var(--color-warning)]" />
                  {formatRating(slide.rating)}
                </span>
              ) : null}
            </p>
            <Link
              href={`/movie/${slide.slug}`}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[color:var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-brand-contrast)] transition-colors duration-150 hover:brightness-110"
            >
              <Play aria-hidden="true" className="h-4 w-4 fill-current" />
              Play
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 ? (
        <>
          <IconButton
            aria-label="Previous slide"
            variant="ghost"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              pauseThenResume();
              goTo(index - 1);
            }}
          >
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </IconButton>
          <IconButton
            aria-label="Next slide"
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              pauseThenResume();
              goTo(index + 1);
            }}
          >
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          </IconButton>
        </>
      ) : null}
    </div>
  );
}
