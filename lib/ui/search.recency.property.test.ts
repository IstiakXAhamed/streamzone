import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { groupByRecency, type RecencyItem } from "./search";

const itemArb: fc.Arbitrary<RecencyItem & { id: number }> = fc.record({
  id: fc.integer(),
  timestamp: fc.integer({ min: 946_684_800_000, max: 4_102_444_800_000 }).map((ms) => new Date(ms).toISOString()),
});

// Feature: ui-ux-overhaul, Property 19: Recency grouping partitions items by age
describe("Property 19: recency grouping partitions items by age", () => {
  it("each item lands in exactly one bucket; union of buckets equals input with no loss/duplication", () => {
    fc.assert(
      fc.property(fc.array(itemArb, { maxLength: 40 }), (items) => {
        const groups = groupByRecency(items);
        const total = groups.today.length + groups.thisWeek.length + groups.earlier.length;
        expect(total).toBe(items.length);

        const allIds = [...groups.today, ...groups.thisWeek, ...groups.earlier].map((i) => i.id).sort();
        const inputIds = items.map((i) => i.id).sort();
        expect(allIds).toEqual(inputIds);
      }),
      { numRuns: 100 },
    );
  });
});
