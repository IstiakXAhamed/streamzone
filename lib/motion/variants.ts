/**
 * lib/motion/variants.ts
 * Shared framer-motion variants used across primitives and page surfaces.
 * (Req 5.6, 6.5, 14.3, 14.4, 14.6, 20.2)
 */

import type { Variants, Transition } from "framer-motion";

export const EASE_OUT: Transition["ease"] = [0, 0, 0.2, 1];

/** Fade + 16px upward translate, 300ms ease-out (Req 14.1/14.6). */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
};

/** Scroll-reveal variant: fade + 12px upward translate over 400ms (Req 14.6). */
export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT },
  },
};

/** Press feedback: scale down slightly (Req 5.6, 6.5). */
export const scalePress: Variants = {
  rest: { scale: 1 },
  pressed: { scale: 0.97, transition: { duration: 0.1, ease: EASE_OUT } },
};

/** Modal/dialog content: scale 0.95->1 with a spring (Req 14.3/14.4). */
export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: EASE_OUT },
  },
};

/** Save/Like bounce: 1 -> 1.3 -> 1 with spring easing (Req 20.2). */
export const saveBounce: Variants = {
  rest: { scale: 1 },
  bounce: {
    scale: [1, 1.3, 1],
    transition: { duration: 0.3, type: "spring" },
  },
};

/** Stagger container: delays children per `staggerDelays`-computed step. */
export function staggerContainer(staggerChildrenSeconds: number): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: staggerChildrenSeconds },
    },
  };
}
