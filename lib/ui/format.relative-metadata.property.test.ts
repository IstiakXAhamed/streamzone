import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { relativeTime, toSavedItemMetadata } from "./format";

const BUCKET_ORDER = ["minute", "hour", "day", "week", "month", "year", "just now"];

function bucketRank(label: string): number {
  if (label === "just now") return 0;
  for (let i = 0; i < BUCKET_ORDER.length; i++) {
    if (label.includes(BUCKET_ORDER[i])) return i === 0 ? 0 : i;
  }
  return -1;
}

// Feature: ui-ux-overhaul, Property 16: Relative-time and metadata omission are well-formed
describe("Property 16: relative-time and metadata omission are well-formed", () => {
  it("relativeTime returns a non-empty string for any past date, and is monotonic in age", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 * 24 * 60 * 60 * 1000 }),
        fc.integer({ min: 0, max: 1000 * 24 * 60 * 60 * 1000 }),
        (msAgoA, msAgoB) => {
          const now = Date.now();
          const [smallerAge, largerAge] = msAgoA <= msAgoB ? [msAgoA, msAgoB] : [msAgoB, msAgoA];
          const olderLabel = relativeTime(now - largerAge, now);
          const newerLabel = relativeTime(now - smallerAge, now);
          expect(olderLabel.length).toBeGreaterThan(0);
          expect(newerLabel.length).toBeGreaterThan(0);
          expect(bucketRank(olderLabel)).toBeGreaterThanOrEqual(bucketRank(newerLabel));
        },
      ),
      { numRuns: 100 },
    );
  });

  it("genre list is truncated to at most 3 and missing fields are omitted, not placeholder-rendered", () => {
    fc.assert(
      fc.property(
        fc.record({
          year: fc.option(fc.integer({ min: 1900, max: 2100 }), { nil: null }),
          rating: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: null }),
          genres: fc.option(fc.array(fc.string(), { maxLength: 10 }), { nil: null }),
        }),
        (input) => {
          const vm = toSavedItemMetadata(input);
          if (input.year == null) expect(vm.year).toBeUndefined();
          else expect(vm.year).toBe(input.year);

          if (input.rating == null) expect(vm.rating).toBeUndefined();
          else expect(vm.rating).toBe(input.rating);

          if (!input.genres || input.genres.length === 0) {
            expect(vm.genres).toBeUndefined();
          } else {
            expect(vm.genres!.length).toBeLessThanOrEqual(3);
            expect(vm.genres!.length).toBeLessThanOrEqual(input.genres.length);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
