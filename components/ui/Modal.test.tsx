import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Modal } from "./Modal";

function Harness({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <button>Trigger</button>
      <Modal open onClose={onClose} labelledBy="modal-title">
        <h2 id="modal-title">Confirm sign out</h2>
        <button>Confirm</button>
        <button>Cancel</button>
      </Modal>
    </div>
  );
}

describe("Modal", () => {
  it("has dialog role, aria-modal, and aria-labelledby wired to its heading", async () => {
    render(<Harness onClose={vi.fn()} />);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
  });

  it("traps focus inside the dialog on open", async () => {
    render(<Harness onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Confirm")).toHaveFocus();
    });
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await screen.findByRole("dialog");
    const backdrop = screen.getByTestId("modal-backdrop");
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Harness onClose={vi.fn()} />);
    await screen.findByRole("dialog");
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
