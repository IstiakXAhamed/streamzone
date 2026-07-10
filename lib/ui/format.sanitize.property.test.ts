import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { sanitizeErrorMessage } from "./format";

// Feature: ui-ux-overhaul, Property 28: Error messages are sanitized and bounded
describe("Property 28: error messages are sanitized and bounded", () => {
  it("returns a message at most 120 chars with no status codes/URLs/stack markers, and a non-empty fallback for empty input", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(""),
          fc.constant("   "),
          fc.string({ maxLength: 300 }),
          fc.string({ maxLength: 200 }).map((s) => `Error: ${s} at Object.<anonymous> (https://example.com/x.js:10:5) 500`),
        ),
        (raw) => {
          const result = sanitizeErrorMessage(raw);
          expect(result.length).toBeGreaterThan(0);
          expect(result.length).toBeLessThanOrEqual(120);
          expect(result).not.toMatch(/https?:\/\//i);
          expect(result).not.toMatch(/\bat\s+[\w$.<>]+\s*\(/);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("returns the non-empty fallback for empty/whitespace-only input", () => {
    expect(sanitizeErrorMessage("").length).toBeGreaterThan(0);
    expect(sanitizeErrorMessage("   ").length).toBeGreaterThan(0);
    expect(sanitizeErrorMessage(null).length).toBeGreaterThan(0);
    expect(sanitizeErrorMessage(undefined).length).toBeGreaterThan(0);
  });
});
