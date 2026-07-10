import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { applyOptimistic, confirm, revert } from "./optimistic";

// Feature: ui-ux-overhaul, Property 24: Optimistic updates round-trip on revert
describe("Property 24: optimistic updates round-trip on revert", () => {
  it("confirm leaves applied value in place; revert restores exact prior state; revert is idempotent", () => {
    fc.assert(
      fc.property(fc.anything(), fc.anything(), (previous, next) => {
        const entry = applyOptimistic(previous, next);

        const confirmed = confirm(entry);
        expect(confirmed.applied).toBe(next);
        expect(confirmed.confirmed).toBe(true);

        const reverted = revert(entry);
        expect(reverted.applied).toBe(previous);
        expect(reverted.previous).toBe(previous);

        const revertedAgain = revert(reverted);
        expect(revertedAgain.applied).toBe(previous);
        expect(revertedAgain.previous).toBe(previous);
      }),
      { numRuns: 100 },
    );
  });
});
