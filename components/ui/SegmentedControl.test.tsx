import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { SegmentedControl } from "./SegmentedControl";

const options = [
  { id: "trending", label: "Trending" },
  { id: "newest", label: "Newest" },
  { id: "a-z", label: "A–Z" },
];

describe("SegmentedControl", () => {
  it("has radiogroup/radio roles and marks the active option checked", () => {
    render(<SegmentedControl aria-label="Sort" options={options} value="trending" onChange={vi.fn()} />);
    expect(screen.getByRole("radiogroup", { name: "Sort" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Trending" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Newest" })).toHaveAttribute("aria-checked", "false");
  });

  it("navigates to the next option with ArrowRight", async () => {
    const onChange = vi.fn();
    render(<SegmentedControl aria-label="Sort" options={options} value="trending" onChange={onChange} />);
    screen.getByRole("radio", { name: "Trending" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("newest");
  });

  it("has no axe violations", async () => {
    const { container } = render(<SegmentedControl aria-label="Sort" options={options} value="trending" onChange={vi.fn()} />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
