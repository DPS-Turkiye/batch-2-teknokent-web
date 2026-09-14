import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StartupStatusDialog } from "@/components/startup/startup-status-dialog";

function form(overrides = {}) {
  return {
    close: vi.fn(),
    draft: {
      statusVersion: "v0.9.2",
      statusSummary: "Öğretmen modülü geliştirme aşamasında.",
      completionPercent: "72",
    },
    error: null as string | null,
    isOpen: true,
    isSaving: false,
    open: vi.fn(),
    setField: vi.fn(),
    submit: vi.fn(),
    ...overrides,
  };
}

describe("StartupStatusDialog", () => {
  it("renders nothing while closed", () => {
    render(<StartupStatusDialog form={form({ isOpen: false })} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("edits the draft and saves it", async () => {
    const user = userEvent.setup();
    const statusForm = form();
    render(<StartupStatusDialog form={statusForm} />);

    expect(
      screen.getByRole("dialog", { name: "Durumu güncelle" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Sürüm")).toHaveValue("v0.9.2");
    await user.type(screen.getByLabelText("Sürüm"), "1");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(statusForm.setField).toHaveBeenCalledWith(
      "statusVersion",
      "v0.9.21",
    );
    expect(statusForm.submit).toHaveBeenCalled();
  });

  it("explains an invalid rate and will not save it", () => {
    render(
      <StartupStatusDialog
        form={form({
          error: "Tamamlanma oranı 0 ile 100 arasında bir tam sayı olmalı.",
        })}
      />,
    );

    expect(screen.getByLabelText("Tamamlanma oranı (%)")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByText(/0 ile 100 arasında/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kaydet" })).toBeDisabled();
  });

  it("closes without saving", async () => {
    const user = userEvent.setup();
    const statusForm = form();
    render(<StartupStatusDialog form={statusForm} />);

    await user.click(screen.getByRole("button", { name: "Vazgeç" }));

    expect(statusForm.close).toHaveBeenCalled();
    expect(statusForm.submit).not.toHaveBeenCalled();
  });
});
