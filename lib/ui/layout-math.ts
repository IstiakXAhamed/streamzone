/**
 * lib/ui/layout-math.ts
 * gridColumnsForWidth, fluidType, staggerDelays, progressWidth.
 * (Req 4.7, 5.3, 7.2, 7.3, 10.5, 12.4, 15.3, 15.4)
 */

/** Clamp a number into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Responsive grid column count as a non-decreasing step function of width:
 * <640: 2, 640-1023: 3, 1024-1279: 4, 1280-1535: 5, 1536+: 6.
 */
export function gridColumnsForWidth(width: number): number {
  if (width < 640) return 2;
  if (width < 1024) return 3;
  if (width < 1280) return 4;
  if (width < 1536) return 5;
  return 6;
}

/**
 * Fluid typography size in px, linearly interpolated between a minimum size
 * at a minimum viewport width and a maximum size at a maximum viewport width,
 * clamped outside that range.
 */
export function fluidType(
  width: number,
  opts: { minSize: number; maxSize: number; minWidth: number; maxWidth: number },
): number {
  const { minSize, maxSize, minWidth, maxWidth } = opts;
  if (maxWidth <= minWidth) return maxSize;
  const t = clamp((width - minWidth) / (maxWidth - minWidth), 0, 1);
  return minSize + t * (maxSize - minSize);
}

/**
 * Per-item stagger delays: index * step for indices below `cap`, then 0
 * for indices at or above `cap`. Always non-negative, length === count.
 */
export function staggerDelays(count: number, step: number, cap: number): number[] {
  const n = Math.max(0, Math.floor(count));
  const delays: number[] = [];
  for (let i = 0; i < n; i++) {
    delays.push(i < cap ? i * step : 0);
  }
  return delays;
}

/**
 * Clamped, monotonic progress-bar width ratio in [0, 1].
 * Returns 0 when duration <= 0; otherwise clamp(position/duration, 0, 1).
 */
export function progressWidth(position: number, duration: number): number {
  if (duration <= 0) return 0;
  return clamp(position / duration, 0, 1);
}
