import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { sortMovies, type SortableMovie, type SortKey } from "./sort";

const movieArb: fc.Arbitrary<SortableMovie> = fc.record({
  title: fc.string({ minLength: 1, maxLength: 20 }),
  year: fc.option(fc.integer({ min: 1900, max: 2100 }), { nil: null }),
  rating: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: null }),
  views_count: fc.integer({ min: 0, max: 1_000_000 }),
});

function isPermutation<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const remaining = b.slice();
  for (const item of a) {
    const idx = remaining.findIndex((candidate) => candidate === item);
    if (idx === -1) return false;
    remaining.splice(idx, 1);
  }
  return remaining.length === 0;
}

const KEYS: SortKey[] = ["trending", "newest", "highest-rated", "a-z"];

// Feature: ui-ux-overhaul, Property 9: Sort comparators produce an ordered permutation
describe("Property 9: sort comparators produce an ordered permutation", () => {
  it("sorted output is a permutation of the input and correctly ordered by the chosen key", () => {
    fc.assert(
      fc.property(fc.array(movieArb, { maxLength: 30 }), fc.constantFrom(...KEYS), (movies, key) => {
        const sorted = sortMovies(movies, key);
        expect(isPermutation(movies, sorted)).toBe(true);

        for (let i = 0; i < sorted.length - 1; i++) {
          const a = sorted[i];
          const b = sorted[i + 1];
          if (key === "trending") {
            expect(a.views_count).toBeGreaterThanOrEqual(b.views_count);
          } else if (key === "newest") {
            expect(a.year ?? -Infinity).toBeGreaterThanOrEqual(b.year ?? -Infinity);
          } else if (key === "highest-rated") {
            expect(a.rating ?? -Infinity).toBeGreaterThanOrEqual(b.rating ?? -Infinity);
          } else {
            expect(a.title.toLowerCase().localeCompare(b.title.toLowerCase())).toBeLessThanOrEqual(0);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
