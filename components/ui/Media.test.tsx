import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Media } from "./Media";

beforeAll(() => {
  // jsdom does not implement real image decoding; Next's <Image> uses
  // img.decode() (not the native onLoad attribute) to detect load
  // completion. Stub it to resolve immediately so onLoad fires in tests.
  if (!("decode" in HTMLImageElement.prototype)) {
    // @ts-expect-error -- test polyfill
    HTMLImageElement.prototype.decode = () => Promise.resolve();
  }
});

describe("Media", () => {
  it("renders the fallback graphic when src is missing", () => {
    render(<Media src={null} alt="Missing poster" ratio="2/3" />);
    // The image should not be rendered; fallback icon container should be.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("fades in on load (opacity toggles from 0 to 100 classes)", async () => {
    render(<Media src="/local-poster.jpg" alt="A movie poster" ratio="2/3" />);
    const img = screen.getByAltText("A movie poster") as HTMLImageElement;
    expect(img.className).toContain("opacity-0");
    await act(async () => {
      fireEvent.load(img);
      // allow the decode() promise microtask queue to flush
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(img.className).toContain("opacity-100");
  });

  it("swaps to the fallback graphic on error", () => {
    render(<Media src="https://example.com/broken.jpg" alt="A movie poster" ratio="2/3" />);
    const img = screen.getByAltText("A movie poster");
    act(() => {
      fireEvent.error(img);
    });
    expect(screen.queryByAltText("A movie poster")).not.toBeInTheDocument();
  });
});
