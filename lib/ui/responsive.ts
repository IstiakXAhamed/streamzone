/**
 * lib/ui/responsive.ts
 * isVisibleAt(width, kind) — mobile-only vs desktop-only across the 768px boundary.
 * (Req 15.5, 15.7)
 */

export type VisibilityKind = "mobile-only" | "desktop-only";

export const DESKTOP_BREAKPOINT = 768;

export function isVisibleAt(width: number, kind: VisibilityKind): boolean {
  if (kind === "mobile-only") return width < DESKTOP_BREAKPOINT;
  return width >= DESKTOP_BREAKPOINT;
}
