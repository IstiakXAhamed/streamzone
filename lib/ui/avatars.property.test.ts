import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { visibleAvatars } from "./avatars";

// Feature: ui-ux-overhaul, Property 11: Avatar overflow accounting is exact
describe("Property 11: avatar overflow accounting is exact", () => {
  it("visible <= 8, overflow = total - visible, visible+overflow = total, showOverflow iff total > 8", () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { maxLength: 50 }), (participants) => {
        const result = visibleAvatars(participants);
        expect(result.visible.length).toBeLessThanOrEqual(8);
        expect(result.overflowCount).toBe(participants.length - result.visible.length);
        expect(result.visible.length + result.overflowCount).toBe(participants.length);
        expect(result.showOverflow).toBe(participants.length > 8);
      }),
      { numRuns: 100 },
    );
  });
});
