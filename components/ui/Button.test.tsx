import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Button, IconButton } from "./Button";
import { Heart } from "lucide-react";

describe("Button", () => {
  it("renders children and responds to click", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Play</Button>);
    const button = screen.getByRole("button", { name: "Play" });
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disables interaction while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Button>Play</Button>);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});

describe("IconButton", () => {
  it("requires and exposes an aria-label for icon-only buttons", () => {
    render(
      <IconButton aria-label="Close menu">
        <Heart aria-hidden="true" />
      </IconButton>,
    );
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <IconButton aria-label="Close menu">
        <Heart aria-hidden="true" />
      </IconButton>,
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
