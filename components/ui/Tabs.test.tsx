import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Tabs } from "./Tabs";

const tabs = [
  { id: "friends", label: "Friends" },
  { id: "requests", label: "Requests" },
  { id: "discover", label: "Discover" },
];

describe("Tabs", () => {
  it("has tablist/tab roles and marks the active tab as selected", () => {
    render(<Tabs tabs={tabs} active="friends" onChange={vi.fn()} />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Friends" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Requests" })).toHaveAttribute("aria-selected", "false");
  });

  it("navigates to the next tab with ArrowRight and calls onChange", async () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} active="friends" onChange={onChange} />);
    screen.getByRole("tab", { name: "Friends" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("requests");
  });

  it("wraps around with ArrowLeft from the first tab", async () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} active="friends" onChange={onChange} />);
    screen.getByRole("tab", { name: "Friends" }).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenCalledWith("discover");
  });

  it("has no axe violations", async () => {
    const { container } = render(<Tabs tabs={tabs} active="friends" onChange={vi.fn()} />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
