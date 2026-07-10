import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Sheet } from "./Sheet";

describe("Sheet accessibility", () => {
  it("has no axe violations when open", async () => {
    const { container } = render(
      <Sheet open onClose={vi.fn()} labelledBy="sheet-a11y-title" heightVh={50}>
        <h2 id="sheet-a11y-title">Filters</h2>
        <button>Apply</button>
      </Sheet>,
    );
    await screen.findByRole("dialog");
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
