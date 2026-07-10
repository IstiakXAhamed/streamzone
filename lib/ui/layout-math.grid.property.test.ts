import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { gridColumnsForWidth } from "./layout-math";

// Feature: ui-ux-overhaul, Property 7: Responsive grid column count is a correct, non-decreasing step function
describe("Property 7: responsive grid column count", () => {
  it("returns the correct column count for the breakpoint bucket", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 4000 }), (width) => {
        const result = gridColumnsForWidth(width);
        if (width < 640) expect(result).toBe(2);
        else if (width < 1024) expect(result).toBe(3);
        else if (width < 1280) expect(result).toBe(4);
        else if (width < 1536) expect(result).toBe(5);
        else expect(result).toBe(6);
      }),
      { numRuns: 100 },
    );
  });

  it("is monotonically non-decreasing in width", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4000 }),
        fc.integer({ min: 0, max: 4000 }),
        (a, b) => {
          const [small, large] = a <= b ? [a, b] : [b, a];
          expect(gridColumnsForWidth(large)).toBeGreaterThanOrEqual(gridColumnsForWidth(small));
        },
      ),
      { numRuns: 100 },
    );
  });
});
