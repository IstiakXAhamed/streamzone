import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { formatFileSize } from "./format";

// Feature: ui-ux-overhaul, Property 18: File size formatting has one decimal and is monotonic
describe("Property 18: file size formatting has one decimal and is monotonic", () => {
  it("returns a string with exactly one decimal place for any non-negative size", () => {
    fc.assert(
      fc.property(fc.float({ min: 0, max: 1_000_000, noNaN: true }), (size) => {
        const result = formatFileSize(size);
        expect(result).toMatch(/^\d+\.\d MB$/);
      }),
      { numRuns: 100 },
    );
  });

  it("larger sizes format to non-decreasing displayed numeric values", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        (a, b) => {
          const [small, large] = a <= b ? [a, b] : [b, a];
          const smallVal = parseFloat(formatFileSize(small));
          const largeVal = parseFloat(formatFileSize(large));
          expect(largeVal).toBeGreaterThanOrEqual(smallVal);
        },
      ),
      { numRuns: 100 },
    );
  });
});
