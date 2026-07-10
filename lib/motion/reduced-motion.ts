"use client";

/**
 * lib/motion/reduced-motion.ts
 * useAppReducedMotion() (framer-motion useReducedMotion + app override) and
 * resolveDuration(ms) returning 0 under reduced motion.
 * (Req 14.5, 16.6, 20.6)
 */

import { useReducedMotion } from "framer-motion";

/**
 * Pure duration resolver: returns 0 when reduced motion is active, the
 * input duration otherwise. The animation's target end state (visibility,
 * layout, position) is unaffected by this — callers still apply the same
 * final values, only the transition duration collapses to 0.
 */
export function resolveDuration(durationMs: number, reducedMotion: boolean): number {
  return reducedMotion ? 0 : durationMs;
}

/**
 * App-level reduced-motion hook: OS/browser preference (via framer-motion's
 * useReducedMotion, which listens to `prefers-reduced-motion`) OR an
 * explicit app override (e.g. a user-facing in-app toggle).
 */
export function useAppReducedMotion(appOverride = false): boolean {
  const osPref = useReducedMotion();
  return Boolean(osPref) || appOverride;
}
