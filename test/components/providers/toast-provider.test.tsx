import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ToastProvider, useToast } from "@/components/providers/toast-provider";
import { InLocale } from "@test/test-utils";

function ToastTrigger({ withAction = false }: { withAction?: boolean }) {
  const { showToast } = useToast();
  return (
    <button
      type="button"
      onClick={() =>
        withAction
          ? showToast({
              title: "Deniz Acar onaylandı",
              message: "Deneme programına atandı.",
              tone: "success",
              action: { label: "Detay", onClick: () => {} },
            })
          : showToast({ message: "Profil kaydedildi.", tone: "success" })
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

  it("shows an approval as a dark bar with Detay on the right", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger withAction />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Deniz Acar onaylandı");
    expect(status).toHaveTextContent("Deneme programına atandı.");
    expect(status).not.toHaveTextContent("e-posta");
    expect(screen.getByRole("button", { name: "Detay" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Bildirimi kapat" }),
    ).not.toBeInTheDocument();
  });

  it("reads in English", () => {
    render(
      <InLocale locale="en">
        <ToastProvider>
          <span />
        </ToastProvider>
      </InLocale>,
    );

    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  });
});
