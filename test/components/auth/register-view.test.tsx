import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RegisterView } from "@/components/auth/register-view";
import { ClientApiError } from "@/lib/client/api";
import { InLocale } from "@test/test-utils";

async function fillAccount(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Ad \*/), "Gülse");
  await user.type(screen.getByLabelText(/^Soyad/), "Buran");
  await user.type(screen.getByLabelText(/^E-posta/), "gulse@example.com");
  await user.type(screen.getByLabelText(/^Telefon/), "+905551112233");
  await user.type(screen.getByLabelText(/^Şifre \*/), "Sifre1234!");
  await user.type(screen.getByLabelText(/^Şifre tekrar/), "Sifre1234!");
}

describe("RegisterView", () => {
  it.each([
    [false, "Startup’ınla menton’a katıl"],
    [true, "Mentor olarak menton’a katıl"],
  ])(
    "centers the account form without the legacy illustration (mentor: %s)",
    (isMentor, title) => {
      render(<RegisterView isMentor={isMentor} onSubmit={vi.fn()} />);

      const heading = screen.getByRole("heading", { name: title });
      const form = heading.closest("form");
      expect(form?.parentElement).toHaveClass("w-full", "max-w-[384px]");
      expect(form?.parentElement?.parentElement).toHaveClass(
        "items-center",
        "justify-center",
      );
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /menton.*ana sayfa/i }),
      ).toHaveAttribute("href", "/");
      expect(screen.getByRole("link", { name: "Giriş yap" })).toHaveAttribute(
        "href",
        "/login",
      );
      expect(
        screen.getByRole("button", { name: "Hesap oluştur ve devam et" }),
      ).toBeDisabled();
      expect(form?.querySelectorAll("input")).toHaveLength(6);
    },
  );

  it("submits the completed account with Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RegisterView onSubmit={onSubmit} />);

    await fillAccount(user);
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        firstName: "Gülse",
        lastName: "Buran",
        email: "gulse@example.com",
        phone: "+905551112233",
        password: "Sifre1234!",
        passwordConfirm: "Sifre1234!",
      }),
    );
    expect(
      screen.getByRole("button", { name: "Hesap oluşturuluyor…" }),
    ).toBeDisabled();
  });

  it("keeps entered fields and allows retry after a registration error", async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(
        new ClientApiError("Bu e-posta zaten kayıtlı.", 409),
      )
      .mockResolvedValueOnce(undefined);
    render(<RegisterView onSubmit={onSubmit} />);

    await fillAccount(user);
    await user.click(
      screen.getByRole("button", { name: "Hesap oluştur ve devam et" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Bu e-posta zaten kayıtlı.",
    );
    expect(screen.getByLabelText(/^E-posta/)).toHaveValue("gulse@example.com");
    await user.click(
      screen.getByRole("button", { name: "Hesap oluştur ve devam et" }),
    );
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("preserves the English account form", () => {
    render(
      <InLocale locale="en">
        <RegisterView isMentor onSubmit={vi.fn()} />
      </InLocale>,
    );

    expect(
      screen.getByRole("heading", { name: "Join menton as a mentor" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^First name/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create account and continue" }),
    ).toBeDisabled();
  });
});
