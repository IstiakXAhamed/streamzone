import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { isValidAltText, isValidIconLabel } from "./a11y";

// Feature: ui-ux-overhaul, Property 23: Alt-text and icon-label validation enforce length bounds
describe("Property 23: alt-text and icon-label validation enforce length bounds", () => {
  it("meaningful alt text is valid iff length in [5,150]; decorative valid iff exactly empty string", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 300 }), (alt) => {
        expect(isValidAltText(alt, "meaningful")).toBe(alt.length >= 5 && alt.length <= 150);
        expect(isValidAltText(alt, "decorative")).toBe(alt === "");
      }),
      { numRuns: 100 },
    );
  });

  it("icon-only button label is valid iff its trimmed length is >= 3", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 50 }), (label) => {
        expect(isValidIconLabel(label)).toBe(label.trim().length >= 3);
      }),
      { numRuns: 100 },
    );
  });
});
