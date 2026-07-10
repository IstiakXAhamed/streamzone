import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { MovieDetailContent } from "./MovieDetailContent";
import { ToastProvider } from "@/components/ui/Toast";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

beforeAll(() => {
  if (!("decode" in HTMLImageElement.prototype)) {
    // @ts-expect-error -- test polyfill
    HTMLImageElement.prototype.decode = () => Promise.resolve();
  }
});

function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

const movie = {
  id: "1",
  title: "Test Movie",
  slug: "test-movie",
  description: "A thrilling test movie.",
  year: 2024,
  duration_seconds: 7260,
  genre: ["Action", "Drama"],
  poster_url: "/poster.jpg",
  backdrop_url: "/backdrop.jpg",
  rating: 8.7,
  trailer_drive_file_id: null,
};

describe("MovieDetailContent", () => {
  it("renders title, formatted duration, and rating", () => {
    renderWithProviders(<MovieDetailContent movie={movie} related={[]} />);
    expect(screen.getByText("Test Movie")).toBeInTheDocument();
    expect(screen.getByText(/121m/)).toBeInTheDocument();
    expect(screen.getByText(/8\.7/)).toBeInTheDocument();
  });

  it("renders genre pill links pointing to /category/[genre]", () => {
    renderWithProviders(<MovieDetailContent movie={movie} related={[]} />);
    expect(screen.getByRole("link", { name: "Action" })).toHaveAttribute("href", "/category/action");
    expect(screen.getByRole("link", { name: "Drama" })).toHaveAttribute("href", "/category/drama");
  });

  it("renders Play/Save/Download/Watch Party action buttons", () => {
    renderWithProviders(<MovieDetailContent movie={movie} related={[]} />);
    expect(screen.getByRole("link", { name: /Play/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Download/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Watch Party/i })).toBeInTheDocument();
  });

  it("omits the More Like This section entirely when there is no related content (Req 19.4)", () => {
    renderWithProviders(<MovieDetailContent movie={movie} related={[]} />);
    expect(screen.queryByText("More Like This")).not.toBeInTheDocument();
  });

  it("renders the More Like This carousel when related movies are present", () => {
    renderWithProviders(
      <MovieDetailContent
        movie={movie}
        related={[
          { id: "2", title: "Related Movie", slug: "related-movie", year: 2023, rating: 7.1, poster_url: null, backdrop_url: null, duration_seconds: 3600 },
        ]}
      />,
    );
    expect(screen.getByText("More Like This")).toBeInTheDocument();
  });
});
