import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { staggerDelays } from "./layout-math";

// Feature: ui-ux-overhaul, Property 8: Stagger delays apply the step up to the cap, then zero
describe("Property 8: stagger delays apply the step up to the cap, then zero", () => {
  it("returns a list of length count where indices<cap get index*step and indices>=cap get 0, all non-negative", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200 }),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 0, max: 200 }),
        (count, step, cap) => {
          const delays = staggerDelays(count, step, cap);
          expect(delays.length).toBe(count);
          delays.forEach((d, i) => {
            expect(d).toBeGreaterThanOrEqual(0);
            if (i < cap) expect(d).toBe(i * step);
            else expect(d).toBe(0);
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});
