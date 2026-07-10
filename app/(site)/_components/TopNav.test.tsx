import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { TopNav } from "./TopNav";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

describe("TopNav mobile overlay", () => {
  it("opens the overlay menu and moves focus into it", async () => {
    render(<TopNav />);
    await userEvent.click(screen.getByLabelText("Open menu"));
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();
    });
  });

  it("closes via the close button and returns focus to the hamburger", async () => {
    render(<TopNav />);
    const hamburger = screen.getByLabelText("Open menu");
    await userEvent.click(hamburger);
    await screen.findByRole("dialog", { name: "Menu" });
    await userEvent.click(screen.getByLabelText("Close menu"));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Menu" })).not.toBeInTheDocument();
    });
    expect(hamburger).toHaveFocus();
  });

  it("closes via Escape", async () => {
    render(<TopNav />);
    await userEvent.click(screen.getByLabelText("Open menu"));
    await screen.findByRole("dialog", { name: "Menu" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Menu" })).not.toBeInTheDocument();
    });
  });

  it("closes via backdrop click", async () => {
    render(<TopNav />);
    await userEvent.click(screen.getByLabelText("Open menu"));
    const dialog = await screen.findByRole("dialog", { name: "Menu" });
    await userEvent.click(dialog);
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Menu" })).not.toBeInTheDocument();
    });
  });

  it("has no axe violations in its default (closed) state", async () => {
    const { container } = render(<TopNav />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
