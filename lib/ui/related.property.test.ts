import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { relatedMovies, type RelatedMovieCandidate } from "./related";

const movieArb: fc.Arbitrary<RelatedMovieCandidate> = fc.record({
  id: fc.uuid(),
  genres: fc.array(fc.constantFrom("Action", "Drama", "Comedy", "Horror", "SciFi"), { maxLength: 4 }),
});

// Feature: ui-ux-overhaul, Property 5: Related-movie selection shares a genre, excludes self, and is capped
describe("Property 5: related-movie selection", () => {
  it("every result shares >=1 genre with current, excludes self, and is capped at 20", () => {
    fc.assert(
      fc.property(movieArb, fc.array(movieArb, { maxLength: 60 }), (current, catalogue) => {
        const result = relatedMovies(current, catalogue);
        expect(result.length).toBeLessThanOrEqual(20);
        for (const movie of result) {
          expect(movie.id).not.toBe(current.id);
          const sharesGenre = movie.genres.some((g) => current.genres.includes(g));
          expect(sharesGenre).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });
});
