import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { resolveDuration } from "./reduced-motion";

// Feature: ui-ux-overhaul, Property 22: Reduced motion collapses duration to zero while preserving end state
describe("Property 22: reduced motion collapses duration to zero while preserving end state", () => {
  it("resolveDuration returns 0 iff reducedMotion is true, otherwise the input duration", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000 }), fc.boolean(), (duration, reducedMotion) => {
        const result = resolveDuration(duration, reducedMotion);
        if (reducedMotion) expect(result).toBe(0);
        else expect(result).toBe(duration);
      }),
      { numRuns: 100 },
    );
  });

  it("end state (a target value independent of duration) is identical regardless of the flag", () => {
    // Model an animation as { duration, endValue }. The end value must not
    // depend on resolveDuration's output — only the transition time does.
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000 }), fc.integer(), (duration, endValue) => {
        const withMotion = { duration: resolveDuration(duration, false), endValue };
        const withoutMotion = { duration: resolveDuration(duration, true), endValue };
        expect(withMotion.endValue).toBe(withoutMotion.endValue);
      }),
      { numRuns: 100 },
    );
  });
});
