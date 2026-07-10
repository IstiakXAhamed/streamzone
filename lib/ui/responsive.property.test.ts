import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { isVisibleAt, DESKTOP_BREAKPOINT } from "./responsive";

// Feature: ui-ux-overhaul, Property 30: Responsive visibility is mutually exclusive across the 768px boundary
describe("Property 30: responsive visibility is mutually exclusive across the 768px boundary", () => {
  it("mobile-only visible iff width < 768; desktop-only visible iff width >= 768; exactly one is visible", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 4000 }), (width) => {
        const mobile = isVisibleAt(width, "mobile-only");
        const desktop = isVisibleAt(width, "desktop-only");
        expect(mobile).toBe(width < DESKTOP_BREAKPOINT);
        expect(desktop).toBe(width >= DESKTOP_BREAKPOINT);
        expect(mobile).not.toBe(desktop);
        expect(mobile || desktop).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
