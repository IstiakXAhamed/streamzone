"use client";

/**
 * components/carousel/EdgeFade.tsx
 * Leading/trailing gradient overlays driven by lib/ui/carousel#edgeFadeVisibility.
 * (Req 4.6)
 */

export interface EdgeFadeProps {
  leading: boolean;
  trailing: boolean;
}

export function EdgeFade({ leading, trailing }: EdgeFadeProps) {
  return (
    <>
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[color:var(--color-surface-0)] to-transparent transition-opacity duration-200",
          leading ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[color:var(--color-surface-0)] to-transparent transition-opacity duration-200",
          trailing ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
    </>
  );
}
