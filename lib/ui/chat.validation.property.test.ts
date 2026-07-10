import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { isValidMessage, MAX_MESSAGE_LENGTH } from "./chat";

// Feature: ui-ux-overhaul, Property 12: Chat message validation enforces the 1-500 character bound
describe("Property 12: chat message validation enforces the 1-500 character bound", () => {
  it("allowed iff trimmed length is in [1,500]", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 700 }), (text) => {
        const trimmedLen = text.trim().length;
        expect(isValidMessage(text)).toBe(trimmedLen >= 1 && trimmedLen <= MAX_MESSAGE_LENGTH);
      }),
      { numRuns: 100 },
    );
  });

  it("rejects strings whose trimmed length exceeds 500", () => {
    const longText = "a".repeat(501);
    expect(isValidMessage(longText)).toBe(false);
  });

  it("accepts a trimmed length of exactly 500", () => {
    const exact = "a".repeat(500);
    expect(isValidMessage(exact)).toBe(true);
  });
});
