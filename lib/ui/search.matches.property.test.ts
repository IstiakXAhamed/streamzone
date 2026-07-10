import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { matches, type SearchableTitle } from "./search";

const itemArb: fc.Arbitrary<SearchableTitle> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 30 }),
});

// Feature: ui-ux-overhaul, Property 26: Search matching gates on length and returns only matching, capped results
describe("Property 26: search matching gates on length and returns capped, matching results", () => {
  it("empty result when query length < 2; otherwise every result contains query case-insensitively, capped at 10", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 10 }), fc.array(itemArb, { maxLength: 40 }), (query, items) => {
        const result = matches(query, items);
        if (query.length < 2) {
          expect(result.length).toBe(0);
        } else {
          expect(result.length).toBeLessThanOrEqual(10);
          for (const item of result) {
            expect(item.title.toLowerCase()).toContain(query.toLowerCase());
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
