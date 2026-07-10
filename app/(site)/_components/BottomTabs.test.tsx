import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { BottomTabs } from "./BottomTabs";

let currentPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({ push: vi.fn() }),
}));

describe("BottomTabs", () => {
  afterEach(() => {
    currentPathname = "/";
    vi.restoreAllMocks();
  });

  it("marks the Home tab active via aria-current when on /", () => {
    currentPathname = "/";
    render(<BottomTabs />);
    expect(screen.getByRole("link", { name: /Home/i })).toHaveAttribute("aria-current", "page");
  });

  it("scrolls to top instead of navigating when the active tab is tapped again", async () => {
    currentPathname = "/";
    const scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo;
    render(<BottomTabs />);
    await userEvent.click(screen.getByRole("link", { name: /Home/i }));
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("falls back gracefully when the Vibration API is absent", async () => {
    currentPathname = "/search";
    // Ensure no `vibrate` method exists on navigator in this environment.
    expect("vibrate" in navigator).toBe(false);
    render(<BottomTabs />);
    // Should not throw when tapping a tab without haptic support.
    await expect(userEvent.click(screen.getByRole("link", { name: /Home/i }))).resolves.not.toThrow();
  });

  it("has role=navigation with an accessible label and no axe violations", async () => {
    currentPathname = "/";
    const { container } = render(<BottomTabs />);
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
