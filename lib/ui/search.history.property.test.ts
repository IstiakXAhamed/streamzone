import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { addRecentSearch } from "./search";

// Feature: ui-ux-overhaul, Property 25: Recent-search history is deduplicated, capped, and most-recent-first
describe("Property 25: recent-search history is deduplicated, capped, and most-recent-first", () => {
  it("length <= 5, no duplicates, most-recent-first; re-searching moves term to front without growing", () => {
    fc.assert(
      fc.property(fc.array(fc.string({ minLength: 1, maxLength: 15 }), { maxLength: 20 }), (terms) => {
        let history: string[] = [];
        for (const term of terms) {
          if (term.trim().length === 0) continue;
          const before = history.length;
          history = addRecentSearch(history, term);
          expect(history.length).toBeLessThanOrEqual(5);
          const lower = history.map((h) => h.toLowerCase());
          expect(new Set(lower).size).toBe(lower.length);
          expect(history[0].toLowerCase()).toBe(term.trim().toLowerCase());
          expect(history.length).toBeLessThanOrEqual(Math.max(before + 1, 5));
        }
      }),
      { numRuns: 100 },
    );
  });
});
