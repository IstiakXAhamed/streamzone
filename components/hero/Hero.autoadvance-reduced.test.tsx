import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero, type HeroSlide } from "./Hero";

/**
 * Feature: ui-ux-overhaul — reduced-motion integration smoke test (Req
 * 14.5, 16.6, 20.6): asserts the Hero's auto-advance interval is gated on
 * useAppReducedMotion. Complements Property 22 (unit-level duration
 * resolution) with a component-level check.
 *
 * This "enabled" case lives in its own file so framer-motion's
 * module-level useReducedMotion() singleton (which caches the OS
 * preference on first read within a module graph — see motion-dom's
 * `hasReducedMotionListener`) reliably reflects this file's mocked
 * matchMedia value.
 */
function mockMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reducedMotion : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const slides: HeroSlide[] = [
  { id: "1", slug: "one", title: "Slide One", year: 2024, rating: 8, backdropUrl: null, posterUrl: null },
  { id: "2", slug: "two", title: "Slide Two", year: 2023, rating: 7, backdropUrl: null, posterUrl: null },
];

beforeAll(() => {
  if (!("decode" in HTMLImageElement.prototype)) {
    // @ts-expect-error -- test polyfill
    HTMLImageElement.prototype.decode = () => Promise.resolve();
  }
  mockMatchMedia(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Hero auto-advance scheduling (reduced motion enabled)", () => {
  it("does not schedule the auto-advance interval at autoAdvanceMs when prefers-reduced-motion is enabled", () => {
    const setIntervalSpy = vi.spyOn(window, "setInterval");
    render(<Hero slides={slides} autoAdvanceMs={1000} />);
    expect(screen.getByText("Slide One")).toBeInTheDocument();

    // Only assert against calls scheduled at our autoAdvanceMs delay —
    // framer-motion's internal 60fps ticker also calls setInterval/rAF
    // shims independent of this component's own auto-advance logic.
    const matchingCalls = setIntervalSpy.mock.calls.filter(([, delay]) => delay === 1000);
    expect(matchingCalls).toHaveLength(0);
  });
});
