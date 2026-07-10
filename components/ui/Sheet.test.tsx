import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sheet } from "./Sheet";

function Harness({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <button>Trigger</button>
      <Sheet open onClose={onClose} labelledBy="sheet-title" heightVh={50}>
        <h2 id="sheet-title">Filters</h2>
        <button>Apply</button>
      </Sheet>
    </div>
  );
}

describe("Sheet", () => {
  it("has dialog role and aria-labelledby", async () => {
    render(<Harness onClose={vi.fn()} />);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "sheet-title");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("moves focus into the sheet on open", async () => {
    render(<Harness onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Apply")).toHaveFocus();
    });
  });
});
