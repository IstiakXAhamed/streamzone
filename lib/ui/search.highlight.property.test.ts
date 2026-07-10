import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { highlightRanges } from "./search";

// Feature: ui-ux-overhaul, Property 27: Search highlighting round-trips the title
describe("Property 27: search highlighting round-trips the title", () => {
  it("joining segments reproduces the title exactly; highlighted segments equal query case-insensitively; segments don't overlap", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 30 }), fc.string({ maxLength: 10 }), (title, query) => {
        const segments = highlightRanges(title, query);
        const joined = segments.map((s) => s.text).join("");
        expect(joined).toBe(title);

        for (const seg of segments) {
          if (seg.highlighted) {
            expect(seg.text.toLowerCase()).toBe(query.toLowerCase());
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
