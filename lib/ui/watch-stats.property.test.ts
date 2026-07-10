import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { computeWatchStats, continueWatching, type WatchStatsEntry, type ContinueWatchingEntry } from "./watch-stats";

const entryArb: fc.Arbitrary<WatchStatsEntry> = fc.record({
  movieId: fc.uuid(),
  positionSeconds: fc.integer({ min: 0, max: 100_000 }),
  durationSeconds: fc.integer({ min: 1, max: 100_000 }),
  watchedAt: fc.integer({ min: 946_684_800_000, max: 4_102_444_800_000 }).map((ms) => new Date(ms).toISOString()),
  genres: fc.array(fc.constantFrom("Action", "Drama", "Comedy"), { maxLength: 3 }),
});

// Feature: ui-ux-overhaul, Property 20: Watch statistics aggregate correctly (including the empty case)
describe("Property 20: watch statistics aggregate correctly", () => {
  it("uniqueMovies = distinct movie count, totalHours = round(sum/3600), favoriteGenre has max distinct-movie coverage", () => {
    fc.assert(
      fc.property(fc.array(entryArb, { maxLength: 40 }), (history) => {
        const stats = computeWatchStats(history);
        const expectedUnique = new Set(history.map((h) => h.movieId)).size;
        expect(stats.uniqueMovies).toBe(expectedUnique);

        const expectedHours = Math.round(history.reduce((sum, h) => sum + h.positionSeconds, 0) / 3600);
        expect(stats.totalHours).toBe(expectedHours);

        if (history.length === 0) {
          expect(stats.favoriteGenre).toBeNull();
        } else if (stats.favoriteGenre !== null) {
          const genreMovies = new Map<string, Set<string>>();
          for (const h of history) {
            for (const g of h.genres) {
              if (!genreMovies.has(g)) genreMovies.set(g, new Set());
              genreMovies.get(g)!.add(h.movieId);
            }
          }
          const favoriteCount = genreMovies.get(stats.favoriteGenre)?.size ?? 0;
          for (const [, movies] of genreMovies) {
            expect(movies.size).toBeLessThanOrEqual(favoriteCount);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it("empty history returns zeros and null favorite genre", () => {
    const stats = computeWatchStats([]);
    expect(stats).toEqual({ uniqueMovies: 0, totalHours: 0, favoriteGenre: null });
  });
});

const cwEntryArb: fc.Arbitrary<ContinueWatchingEntry> = fc.record({
  movieId: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 20 }),
  positionSeconds: fc.integer({ min: 0, max: 100_000 }),
  durationSeconds: fc.integer({ min: 1, max: 100_000 }),
  watchedAt: fc.integer({ min: 946_684_800_000, max: 4_102_444_800_000 }).map((ms) => new Date(ms).toISOString()),
  genres: fc.array(fc.constantFrom("Action", "Drama"), { maxLength: 2 }),
});

// Feature: ui-ux-overhaul, Property 21: Continue-watching filter selects in-progress items, ordered and capped
describe("Property 21: continue-watching filter", () => {
  it("selects items with 0 < position < 90% duration, ordered by recency, capped at 30", () => {
    fc.assert(
      fc.property(fc.array(cwEntryArb, { maxLength: 60 }), (history) => {
        const result = continueWatching(history);
        expect(result.length).toBeLessThanOrEqual(30);
        for (const item of result) {
          expect(item.positionSeconds).toBeGreaterThan(0);
          expect(item.positionSeconds).toBeLessThan(item.durationSeconds * 0.9);
        }
        for (let i = 0; i < result.length - 1; i++) {
          const a = new Date(result[i].watchedAt).getTime();
          const b = new Date(result[i + 1].watchedAt).getTime();
          expect(a).toBeGreaterThanOrEqual(b);
        }
      }),
      { numRuns: 100 },
    );
  });
});
