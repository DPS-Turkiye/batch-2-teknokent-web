import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Toaster } from "@/components/common/toaster";
import { useToast } from "@/stores/toast-store";
import { InLocale } from "@test/test-utils";
import { ToastTone } from "@/interfaces/toast";

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
              tone: ToastTone.Success,
              action: { label: "Detay", onClick: () => {} },
            })
          : showToast({
              message: "Profil kaydedildi.",
              tone: ToastTone.Success,
            })
      }
    >
      Kaydet
    </button>
  );
}

describe("Toaster", () => {
  it("announces feedback and lets the user dismiss it", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ToastTrigger />
        <Toaster />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(screen.getByRole("status")).toHaveTextContent("Profil kaydedildi.");

    await user.click(screen.getByRole("button", { name: "Bildirimi kapat" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows an approval as a dark bar with Detay on the right", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ToastTrigger withAction />
        <Toaster />
      </>,
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
        <Toaster />
      </InLocale>,
    );

    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  });
});
