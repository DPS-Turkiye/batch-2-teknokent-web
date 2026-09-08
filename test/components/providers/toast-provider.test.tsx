import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ToastProvider, useToast } from "@/components/providers/toast-provider";

function ToastTrigger() {
  const { showToast } = useToast();
  return (
    <button
      type="button"
      onClick={() =>
        showToast({ message: "Profil kaydedildi.", tone: "success" })
      }
    >
      Kaydet
    </button>
  );
}

describe("ToastProvider", () => {
  it("announces feedback and lets the user dismiss it", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(screen.getByRole("status")).toHaveTextContent("Profil kaydedildi.");

    await user.click(screen.getByRole("button", { name: "Bildirimi kapat" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
