"use client";

/**
 * components/layout/PageTransition.tsx
 * Route-level transition using React's native <ViewTransition> (Req 14.1).
 * Requires experimental.viewTransition: true in next.config.ts.
 */

import { ViewTransition, type ReactNode } from "react";

export interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Wraps page content so route navigations animate with a fade-up entry.
 * Pair with <Link transitionTypes={['nav-forward' | 'nav-back']}> on the
 * navigating links to get directional intent; without a transition type
 * this still crossfades via the `default` animation.
 */
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <ViewTransition enter="fade-up" default="fade-up">
      {children}
    </ViewTransition>
  );
}
