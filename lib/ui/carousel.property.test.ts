import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { edgeFadeVisibility } from "./carousel";

// Feature: ui-ux-overhaul, Property 3: Carousel edge-fade visibility follows scroll metrics
describe("Property 3: carousel edge-fade visibility follows scroll metrics", () => {
  it("leading iff scrollLeft>0; trailing iff scrollLeft+clientWidth<scrollWidth; both hidden when content fits", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5000 }),
        fc.integer({ min: 0, max: 5000 }),
        fc.integer({ min: 0, max: 5000 }),
        (scrollLeft, clientWidth, scrollWidth) => {
          const result = edgeFadeVisibility(scrollLeft, clientWidth, scrollWidth);
          expect(result.leading).toBe(scrollLeft > 0);
          expect(result.trailing).toBe(scrollLeft + clientWidth < scrollWidth);
          if (clientWidth >= scrollWidth) {
            // content fits within viewport at scrollLeft=0
            if (scrollLeft === 0) {
              expect(result.leading).toBe(false);
              expect(result.trailing).toBe(false);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
