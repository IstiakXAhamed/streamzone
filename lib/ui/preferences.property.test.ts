import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { createMemoryStorage, readSavedView, writeSavedView, type SavedView } from "./preferences";

// Feature: ui-ux-overhaul, Property 15: Saved-view preference round-trips through persistence
describe("Property 15: saved-view preference round-trips through persistence", () => {
  it("writing then reading returns the same value", () => {
    fc.assert(
      fc.property(fc.constantFrom<SavedView>("grid", "list"), (view) => {
        const storage = createMemoryStorage();
        writeSavedView(storage, view);
        expect(readSavedView(storage)).toBe(view);
      }),
      { numRuns: 100 },
    );
  });
});
