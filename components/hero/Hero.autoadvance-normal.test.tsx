import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero, type HeroSlide } from "./Hero";

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
  mockMatchMedia(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Hero auto-advance scheduling (reduced motion disabled)", () => {
  it("schedules the auto-advance interval at exactly autoAdvanceMs when reduced motion is not enabled", () => {
    const setIntervalSpy = vi.spyOn(window, "setInterval");
    render(<Hero slides={slides} autoAdvanceMs={1234} />);
    expect(screen.getByText("Slide One")).toBeInTheDocument();

    const matchingCalls = setIntervalSpy.mock.calls.filter(([, delay]) => delay === 1234);
    expect(matchingCalls.length).toBeGreaterThan(0);
  });
});
