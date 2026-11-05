import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ModalDialog } from "@/components/common/modal-dialog";

function Dialog({ onClose }: { onClose: () => void }) {
  return (
    <ModalDialog labelledBy="title" onClose={onClose}>
      <h2 id="title">Başlık</h2>
      <input aria-label="Ad" />
      <button type="button">Kaydet</button>
    </ModalDialog>
  );
}

describe("ModalDialog", () => {
  it("dismisses only backdrop clicks when explicitly enabled", () => {
    const onClose = vi.fn();
    render(
      <ModalDialog
        labelledBy="backdrop-title"
        onClose={onClose}
        dismissOnBackdrop
      >
        <h2 id="backdrop-title">Panel</h2>
        <button type="button">Inside</button>
      </ModalDialog>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Inside" }));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("dialog").parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it("moves focus to the first field and closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Dialog onClose={onClose} />);

    expect(screen.getByLabelText("Ad")).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps Tab inside the dialog", async () => {
    const user = userEvent.setup();
    render(<Dialog onClose={vi.fn()} />);

    await user.tab();
    expect(screen.getByRole("button", { name: "Kaydet" })).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText("Ad")).toHaveFocus();
  });

  it("gives focus back to what opened it", () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const { unmount } = render(<Dialog onClose={vi.fn()} />);

    unmount();

    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});
