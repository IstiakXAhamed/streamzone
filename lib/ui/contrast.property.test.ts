import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  contrastRatio,
  enumerateTokenPairings,
  pairingPassesAA,
  type RGB,
} from "./contrast";

const rgbArb = fc.record({
  r: fc.integer({ min: 0, max: 255 }),
  g: fc.integer({ min: 0, max: 255 }),
  b: fc.integer({ min: 0, max: 255 }),
});

// Feature: ui-ux-overhaul, Property 1: Contrast ratios are well-formed and all token pairings pass WCAG AA
describe("Property 1: contrast ratios are well-formed and token pairings pass AA", () => {
  it("is symmetric and lies in [1, 21] for any two colors", () => {
    fc.assert(
      fc.property(rgbArb, rgbArb, (a: RGB, b: RGB) => {
        const forward = contrastRatio(a, b);
        const backward = contrastRatio(b, a);
        expect(forward).toBeCloseTo(backward, 10);
        expect(forward).toBeGreaterThanOrEqual(1);
        expect(forward).toBeLessThanOrEqual(21);
      }),
      { numRuns: 100 },
    );
  });

  it("every (text token, surface token) pairing that can co-occur passes its AA threshold", () => {
    const pairings = enumerateTokenPairings();
    expect(pairings.length).toBeGreaterThan(0);
    for (const pairing of pairings) {
      expect(pairingPassesAA(pairing)).toBe(true);
    }
  });

  it("contrast of a color against itself is always 1", () => {
    fc.assert(
      fc.property(rgbArb, (a: RGB) => {
        expect(contrastRatio(a, a)).toBeCloseTo(1, 10);
      }),
      { numRuns: 100 },
    );
  });
});
