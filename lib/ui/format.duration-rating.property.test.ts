import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { formatDuration, formatRating } from "./format";

// Feature: ui-ux-overhaul, Property 6: Duration and rating formatting obey their format invariants
describe("Property 6: duration and rating formatting invariants", () => {
  it("formatDuration returns floor(seconds/60) + 'm' for any non-negative duration", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000_000 }), (seconds) => {
        const result = formatDuration(seconds);
        expect(result).toBe(`${Math.floor(seconds / 60)}m`);
      }),
      { numRuns: 100 },
    );
  });

  it("formatRating returns a string with exactly one decimal place for any numeric rating", () => {
    fc.assert(
      fc.property(fc.float({ min: -1000, max: 1000, noNaN: true }), (rating) => {
        const result = formatRating(rating);
        expect(result).toMatch(/^-?\d+\.\d$/);
      }),
      { numRuns: 100 },
    );
  });
});
