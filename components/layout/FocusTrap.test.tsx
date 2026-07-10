import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FocusTrap } from "./FocusTrap";

function TrapHarness({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <button>Trigger</button>
      <FocusTrap active onClose={onClose}>
        <button>First</button>
        <button>Second</button>
      </FocusTrap>
    </div>
  );
}

describe("FocusTrap", () => {
  it("moves focus into the container on open", () => {
    render(<TrapHarness onClose={vi.fn()} />);
    expect(screen.getByText("First")).toHaveFocus();
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    render(<TrapHarness onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cycles Tab from the last focusable back to the first", async () => {
    render(<TrapHarness onClose={vi.fn()} />);
    const second = screen.getByText("Second");
    second.focus();
    await userEvent.tab();
    expect(screen.getByText("First")).toHaveFocus();
  });

  it("returns focus to the trigger element on close", () => {
    const trigger = document.createElement("button");
    trigger.textContent = "ExternalTrigger";
    document.body.appendChild(trigger);
    trigger.focus();

    function Harness({ active }: { active: boolean }) {
      return (
        <FocusTrap active={active} onClose={vi.fn()}>
          <button>Inside</button>
        </FocusTrap>
      );
    }

    const { rerender } = render(<Harness active={true} />);
    expect(screen.getByText("Inside")).toHaveFocus();

    rerender(<Harness active={false} />);
    expect(trigger).toHaveFocus();

    document.body.removeChild(trigger);
  });
});
