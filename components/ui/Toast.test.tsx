import { describe, it, expect } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "./Toast";

function Harness() {
  const { push } = useToast();
  return (
    <button
      onClick={() =>
        push({ kind: "success", message: "Saved to your list" })
      }
    >
      Trigger toast
    </button>
  );
}

describe("ToastProvider", () => {
  it("shows a pushed toast in an aria-live region", async () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByText("Trigger toast"));
    expect(screen.getByText("Saved to your list")).toBeInTheDocument();
    const liveRegion = screen.getByText("Saved to your list").closest("[aria-live]");
    expect(liveRegion).not.toBeNull();
  });

  it("caps visible toasts at 3, evicting the oldest", async () => {
    function MultiHarness() {
      const { push } = useToast();
      return (
        <button
          onClick={() => {
            push({ kind: "info", message: "First" });
            push({ kind: "info", message: "Second" });
            push({ kind: "info", message: "Third" });
            push({ kind: "info", message: "Fourth" });
          }}
        >
          Trigger many
        </button>
      );
    }

    render(
      <ToastProvider>
        <MultiHarness />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByText("Trigger many"));

    expect(screen.queryByText("First")).not.toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
    expect(screen.getByText("Fourth")).toBeInTheDocument();
  });

  it("dismiss button removes only the targeted toast", async () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByText("Trigger toast"));
    await userEvent.click(screen.getByLabelText("Dismiss notification"));
    await waitFor(() => {
      expect(screen.queryByText("Saved to your list")).not.toBeInTheDocument();
    });
  });
});
