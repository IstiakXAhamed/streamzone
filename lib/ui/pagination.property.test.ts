import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { paginate } from "./pagination";

// Feature: ui-ux-overhaul, Property 10: Pagination partitions items without loss or duplication
describe("Property 10: pagination partitions items without loss or duplication", () => {
  it("concatenating all pages reproduces the input exactly; every page <= pageSize; no item duplicated across pages", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { maxLength: 300 }),
        fc.integer({ min: 1, max: 100 }),
        (items, pageSize) => {
          const pages = paginate(items, pageSize);
          const concatenated = pages.flat();
          expect(concatenated).toEqual(items);
          for (const page of pages) {
            expect(page.length).toBeLessThanOrEqual(pageSize);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("defaults to page size 50", () => {
    const items = Array.from({ length: 120 }, (_, i) => i);
    const pages = paginate(items);
    expect(pages[0].length).toBe(50);
    expect(pages[1].length).toBe(50);
    expect(pages[2].length).toBe(20);
  });
});
