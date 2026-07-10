"use client";

/**
 * components/hero/Backdrop.tsx
 * Full-width backdrop (min 288px mobile / 384px >=640px), multi-stop
 * gradient, parallax 0.5x on >=1024px via framer-motion useScroll,
 * backdrop -> poster -> black fallback chain through Media.
 * (Req 6.1, 6.2)
 */

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Media } from "@/components/ui/Media";
import { useAppReducedMotion } from "@/lib/motion/reduced-motion";

const PARALLAX_BREAKPOINT = 1024;
const PARALLAX_FACTOR = 0.5;

export interface BackdropProps {
  backdropUrl: string | null;
  posterUrl: string | null;
  alt: string;
  className?: string;
}

export function Backdrop({ backdropUrl, posterUrl, alt, className = "" }: BackdropProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useAppReducedMotion();
  const [parallaxEnabled, setParallaxEnabled] = useState(false);

  useEffect(() => {
    function update() {
      setParallaxEnabled(window.innerWidth >= PARALLAX_BREAKPOINT);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { scrollY } = useScroll();
  const parallaxActive = parallaxEnabled && !reducedMotion;
  const y = useTransform(scrollY, [0, 600], parallaxActive ? [0, 600 * PARALLAX_FACTOR] : [0, 0]);

  const src = backdropUrl ?? posterUrl;

  return (
    <div
      ref={containerRef}
      className={["relative h-72 w-full overflow-hidden sm:h-96", className].join(" ")}
    >
      {src ? (
        <motion.div style={{ y }} className="absolute inset-0 lg:will-change-transform">
          <Media src={src} alt={alt} fill preload containerClassName="absolute inset-0 h-full" />
        </motion.div>
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-black" />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"
      />
    </div>
  );
}
