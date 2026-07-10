import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MovieCard, type MovieCardData } from "./MovieCard";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

beforeAll(() => {
  if (!("decode" in HTMLImageElement.prototype)) {
    // @ts-expect-error -- test polyfill
    HTMLImageElement.prototype.decode = () => Promise.resolve();
  }
});

const movie: MovieCardData = {
  id: "1",
  title: "Test Movie",
  slug: "test-movie",
  year: 2024,
  rating: 8.2,
  poster_url: "/poster.jpg",
  duration_seconds: 7200,
};

describe("MovieCard", () => {
  it("renders title, year, and rating", () => {
    render(<MovieCard movie={movie} />);
    expect(screen.getAllByText("Test Movie").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2024").length).toBeGreaterThan(0);
  });

  it("navigates immediately on release before the long-press threshold", async () => {
    pushMock.mockClear();
    render(<MovieCard movie={movie} />);
    const link = screen.getAllByRole("link", { name: /Test Movie/i })[0];

    fireEvent.touchStart(link);
    fireEvent.touchEnd(link);

    expect(pushMock).toHaveBeenCalledWith("/movie/test-movie");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens the context menu after a long press (>=300ms) instead of navigating", async () => {
    vi.useFakeTimers();
    pushMock.mockClear();
    render(<MovieCard movie={movie} />);
    const link = screen.getAllByRole("link", { name: /Test Movie/i })[0];

    fireEvent.touchStart(link);
    act(() => {
      vi.advanceTimersByTime(350);
    });
    fireEvent.touchEnd(link);

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalledWith("/movie/test-movie");
    vi.useRealTimers();
  });

  it("shows a progress bar when watch position is present", () => {
    render(<MovieCard movie={{ ...movie, watch_position_seconds: 3600 }} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
