/**
 * lib/ui/carousel.ts
 * edgeFadeVisibility(scrollLeft, clientWidth, scrollWidth) — leading/trailing
 * gradient flags. (Req 4.6)
 */

export interface EdgeFadeVisibility {
  leading: boolean;
  trailing: boolean;
}

export function edgeFadeVisibility(scrollLeft: number, clientWidth: number, scrollWidth: number): EdgeFadeVisibility {
  const leading = scrollLeft > 0;
  const trailing = scrollLeft + clientWidth < scrollWidth;
  return { leading, trailing };
}
