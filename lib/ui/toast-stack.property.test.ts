import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { pushToast, dismissToast, MAX_VISIBLE_TOASTS, type Toast } from "./toast-stack";

const toastArb: fc.Arbitrary<Toast> = fc.record({
  id: fc.uuid(),
  kind: fc.constantFrom<Toast["kind"]>("info", "success", "error"),
  message: fc.string({ maxLength: 40 }),
  createdAt: fc.integer({ min: 0, max: 10_000_000 }),
});

// Feature: ui-ux-overhaul, Property 29: Toast stacking never exceeds 3 and evicts the oldest
describe("Property 29: toast stacking never exceeds 3 and evicts the oldest", () => {
  it("visible toasts never exceed 3; a push beyond 3 evicts the oldest preserving remaining order; dismiss removes only the target", () => {
    fc.assert(
      fc.property(fc.array(toastArb, { maxLength: 20 }), (toasts) => {
        let stack: Toast[] = [];
        for (const toast of toasts) {
          const before = stack;
          stack = pushToast(stack, toast);
          expect(stack.length).toBeLessThanOrEqual(MAX_VISIBLE_TOASTS);

          if (before.length === MAX_VISIBLE_TOASTS) {
            // oldest was evicted; remaining order preserved (minus the oldest), new one appended
            expect(stack).toEqual([...before.slice(1), toast]);
          }
        }

        if (stack.length > 0) {
          const targetId = stack[0].id;
          const dismissed = dismissToast(stack, targetId);
          expect(dismissed.length).toBe(stack.length - 1);
          expect(dismissed.find((t) => t.id === targetId)).toBeUndefined();
          for (const t of stack) {
            if (t.id !== targetId) expect(dismissed).toContainEqual(t);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
