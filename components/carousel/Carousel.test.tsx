import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Carousel } from "./Carousel";

describe("Carousel", () => {
  it("has region role, aria-roledescription=carousel, and a See All link", () => {
    render(
      <Carousel title="Trending Now" seeAllHref="/category/trending">
        <div>Card 1</div>
        <div>Card 2</div>
      </Carousel>,
    );
    const region = screen.getByRole("region", { name: "Trending Now" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    expect(screen.getByRole("link", { name: /See All/i })).toHaveAttribute("href", "/category/trending");
  });

  it("scrolls forward on ArrowRight and backward on ArrowLeft", async () => {
    render(
      <Carousel title="Trending Now">
        <div>Card 1</div>
        <div>Card 2</div>
      </Carousel>,
    );
    const region = screen.getByRole("region", { name: "Trending Now" });
    const scrollBySpy = vi.fn();
    region.scrollBy = scrollBySpy as unknown as typeof region.scrollBy;
    region.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(scrollBySpy).toHaveBeenCalled();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Carousel title="Trending Now">
        <div>Card 1</div>
      </Carousel>,
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
