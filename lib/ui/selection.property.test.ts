import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { toggleSelection, selectionCount, removeSelected } from "./selection";

// Feature: ui-ux-overhaul, Property 17: Batch selection count and removal are set-consistent
describe("Property 17: batch selection count and removal are set-consistent", () => {
  it("selected count equals set size; removal yields input minus selection; no unselected item removed", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 5 }), { maxLength: 20 }),
        fc.array(fc.string({ minLength: 1, maxLength: 5 }), { maxLength: 30 }),
        (items, toggles) => {
          let selected = new Set<string>();
          for (const id of toggles) {
            selected = toggleSelection(selected, id);
          }
          expect(selectionCount(selected)).toBe(selected.size);

          const remaining = removeSelected(items, selected, (id) => id);
          const expectedRemaining = items.filter((id) => !selected.has(id));
          expect(remaining).toEqual(expectedRemaining);

          for (const item of items) {
            if (!selected.has(item)) {
              expect(remaining).toContain(item);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
