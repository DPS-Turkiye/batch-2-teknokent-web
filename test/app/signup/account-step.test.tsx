import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RegisterView } from "@/components/auth/register-view";

async function fillAll(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Ad/), "Gülse");
  await user.type(screen.getByLabelText(/Soyad/), "Buran");
  await user.type(screen.getByLabelText(/E-posta/), "gulse@dongu.co");
  await user.type(screen.getByLabelText(/Telefon/), "+905551112233");
  await user.type(screen.getByLabelText("Şifre *"), "sifre1234");
  await user.type(screen.getByLabelText(/Şifre tekrar/), "sifre1234");
}

describe("Account creation step", () => {
  it("lists the four onboarding steps", () => {
    render(<RegisterView onContinue={vi.fn()} />);

    expect(screen.getByText("Nasıl çalışır?")).toBeInTheDocument();
    expect(screen.getByText("Hesabını oluştur")).toBeInTheDocument();
    expect(screen.getByText("Startup profilini tamamla")).toBeInTheDocument();
    expect(screen.getByText("Ekibini davet et")).toBeInTheDocument();
    expect(screen.getByText("Onaydan sonra sisteme katıl")).toBeInTheDocument();
  });

  it("warns when the password is too short", async () => {
    const user = userEvent.setup();
    render(<RegisterView onContinue={vi.fn()} />);

    await user.type(screen.getByLabelText("Şifre *"), "kisa");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Şifre en az 8 karakter olmalı.",
    );
  });

  it("warns when the two passwords differ", async () => {
    const user = userEvent.setup();
    render(<RegisterView onContinue={vi.fn()} />);

    await user.type(screen.getByLabelText("Şifre *"), "sifre1234");
    await user.type(screen.getByLabelText(/Şifre tekrar/), "baskasifre");

    expect(screen.getByRole("alert")).toHaveTextContent("Şifreler eşleşmiyor.");
  });

  it("only continues into onboarding once the form is valid", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<RegisterView onContinue={onContinue} />);

    const cta = screen.getByRole("button", {
      name: "Hesap oluştur ve devam et",
    });
    expect(cta).toBeDisabled();

    await fillAll(user);
    expect(cta).toBeEnabled();

    await user.click(cta);
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("links back to the existing login route", () => {
    render(<RegisterView onContinue={vi.fn()} />);

    expect(screen.getByRole("link", { name: "Giriş yap" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
