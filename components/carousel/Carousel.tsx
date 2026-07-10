"use client";

/**
 * components/carousel/Carousel.tsx
 * Generic horizontally-scrollable carousel: scroll-snap + touch momentum,
 * EdgeFade driven by edgeFadeVisibility, role="region" + aria-roledescription,
 * arrow-key navigation, optional "See All" link.
 * (Req 4.6, 4.9, 16.3, 16.4)
 */

import Link from "next/link";
import { useRef, useState, useCallback, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { edgeFadeVisibility } from "@/lib/ui/carousel";
import { EdgeFade } from "./EdgeFade";

export interface CarouselProps {
  title: string;
  seeAllHref?: string;
  children: ReactNode;
  className?: string;
}

export function Carousel({ title, seeAllHref, children, className = "" }: CarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ leading: false, trailing: false });

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setEdges(edgeFadeVisibility(el.scrollLeft, el.clientWidth, el.scrollWidth));
  }, []);

  function scrollByAmount(amount: number) {
    scrollerRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const el = scrollerRef.current;
    if (!el) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByAmount(el.clientWidth * 0.8);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByAmount(-el.clientWidth * 0.8);
    }
  }

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-title">{title}</h2>
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="flex items-center gap-1 text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]"
          >
            See All
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      <div className="relative">
        <EdgeFade leading={edges.leading} trailing={edges.trailing} />
        <div
          ref={scrollerRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={title}
          tabIndex={0}
          onScroll={updateEdges}
          onKeyDown={handleKeyDown}
          className="mz-snap-x -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
