import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { progressWidth } from "./layout-math";

// Feature: ui-ux-overhaul, Property 4: Progress-bar width is a clamped, monotonic ratio
describe("Property 4: progress-bar width is a clamped, monotonic ratio", () => {
  it("returns a value in [0,1], equal to clamp(position/duration,0,1) when duration>0, and 0 when duration<=0", () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1000, max: 100_000, noNaN: true }),
        fc.float({ min: -1000, max: 100_000, noNaN: true }),
        (position, duration) => {
          const result = progressWidth(position, duration);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(1);
          if (duration <= 0) {
            expect(result).toBe(0);
          } else {
            const expected = Math.min(Math.max(position / duration, 0), 1);
            expect(result).toBeCloseTo(expected, 10);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("is monotonically non-decreasing in position for a fixed positive duration", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 100_000, noNaN: true }),
        fc.float({ min: -1000, max: 100_000, noNaN: true }),
        fc.float({ min: -1000, max: 100_000, noNaN: true }),
        (duration, posA, posB) => {
          const [small, large] = posA <= posB ? [posA, posB] : [posB, posA];
          expect(progressWidth(large, duration)).toBeGreaterThanOrEqual(progressWidth(small, duration));
        },
      ),
      { numRuns: 100 },
    );
  });
});
