import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { isOnline } from "./presence";

// Feature: ui-ux-overhaul, Property 14: Online status respects the 5-minute boundary
describe("Property 14: online status respects the 5-minute boundary", () => {
  it("is online iff now - lastSeen <= 5 minutes, boundary inclusive", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 60 * 60 * 1000 }), (deltaMs) => {
        const now = 1_700_000_000_000;
        const lastSeen = now - deltaMs;
        const result = isOnline(lastSeen, now);
        expect(result).toBe(deltaMs <= 5 * 60 * 1000);
      }),
      { numRuns: 100 },
    );
  });

  it("treats exactly 5 minutes as online", () => {
    const now = 1_700_000_000_000;
    expect(isOnline(now - 5 * 60 * 1000, now)).toBe(true);
    expect(isOnline(now - 5 * 60 * 1000 - 1, now)).toBe(false);
  });
});
