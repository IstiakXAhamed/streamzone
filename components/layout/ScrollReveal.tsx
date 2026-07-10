"use client";

/**
 * components/layout/ScrollReveal.tsx
 * IntersectionObserver-driven reveal: fade + 12px upward translate over
 * 400ms, with 75ms per-child stagger. Reduced-motion collapses to an
 * instant, fully-visible state (Req 14.6, 16.6).
 */

import { useEffect, useRef, useState, Children, type ReactNode } from "react";
import { motion } from "framer-motion";
import { scrollReveal } from "@/lib/motion/variants";
import { staggerDelays } from "@/lib/ui/layout-math";
import { useAppReducedMotion } from "@/lib/motion/reduced-motion";

export interface ScrollRevealProps {
  children: ReactNode;
  /** Per-child stagger step in ms; defaults to 75ms per Req 14.6. */
  staggerStep?: number;
  className?: string;
  threshold?: number;
}

export function ScrollReveal({ children, staggerStep = 75, className = "", threshold = 0.1 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useAppReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion, threshold]);

  const childArray = Children.toArray(children);
  const delaysMs = staggerDelays(childArray.length, staggerStep, childArray.length);

  return (
    <div ref={ref} className={className}>
      {childArray.map((child, i) => (
        <motion.div
          key={i}
          variants={scrollReveal}
          initial="hidden"
          animate={visible ? "visible" : "hidden"}
          transition={{ delay: delaysMs[i] / 1000 }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
