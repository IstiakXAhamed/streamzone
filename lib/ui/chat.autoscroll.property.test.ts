import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { applyIncoming, type ChatScrollState } from "./chat";

// Feature: ui-ux-overhaul, Property 13: Chat auto-scroll and unread accounting depend on scroll position
describe("Property 13: chat auto-scroll and unread accounting depend on scroll position", () => {
  it("auto-scrolls (unread resets to 0) iff at bottom; increments unread and stays scrolled-up otherwise", () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 30 }), // sequence of "isAtBottom" flags per incoming message
        (atBottomSequence) => {
          let state: ChatScrollState = { isAtBottom: true, unreadCount: 0 };
          for (const atBottom of atBottomSequence) {
            state = { ...state, isAtBottom: atBottom };
            const prevUnread = state.unreadCount;
            state = applyIncoming(state);
            if (atBottom) {
              expect(state.isAtBottom).toBe(true);
              expect(state.unreadCount).toBe(0);
            } else {
              expect(state.isAtBottom).toBe(false);
              expect(state.unreadCount).toBe(prevUnread + 1);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
