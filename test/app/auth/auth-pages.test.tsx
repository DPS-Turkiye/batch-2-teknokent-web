import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { LoginView } from "@/components/auth/login-view";
import { RegisterView } from "@/components/auth/register-view";

describe("Login screen", () => {
  it("renders the welcome heading and both credential fields", () => {
    render(<LoginView />);

    expect(
      screen.getByRole("heading", { name: "METUal'a hoş geldin" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/E-posta/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Şifre/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Şifremi unuttum" }),
    ).toBeInTheDocument();
  });

  it("keeps Giriş yap disabled until both fields are filled", async () => {
    const user = userEvent.setup();
    render(<LoginView />);

    const submit = screen.getByRole("button", { name: "Giriş yap" });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/E-posta/), "gulse@dongu.co");
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/Şifre/), "sifre1234");
    expect(submit).toBeEnabled();
  });

  it("offers both join routes for new users", () => {
    render(<LoginView />);

    expect(
      screen.getByRole("link", { name: /Startup'ımla katıl/ }),
    ).toHaveAttribute("href", "/auth/register");
    expect(
      screen.getByRole("link", { name: /Mentor olmak istiyorum/ }),
    ).toHaveAttribute("href", "/auth/register?role=mentor");
  });

  it("masks the password input", () => {
    render(<LoginView />);

    expect(screen.getByLabelText(/Şifre/)).toHaveAttribute("type", "password");
  });
});

describe("Account creation screen", () => {
  async function fillAll(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText(/^Ad/), "Gülse");
    await user.type(screen.getByLabelText(/Soyad/), "Buran");
    await user.type(screen.getByLabelText(/E-posta/), "gulse@dongu.co");
    await user.type(screen.getByLabelText(/Telefon/), "+905551112233");
    await user.type(screen.getByLabelText("Şifre *"), "sifre1234");
    await user.type(screen.getByLabelText(/Şifre tekrar/), "sifre1234");
  }

  it("lists the four onboarding steps", () => {
    render(<RegisterView />);

    expect(screen.getByText("Nasıl çalışır?")).toBeInTheDocument();
    expect(screen.getByText("Hesabını oluştur")).toBeInTheDocument();
    expect(screen.getByText("Startup profilini tamamla")).toBeInTheDocument();
    expect(screen.getByText("Ekibini davet et")).toBeInTheDocument();
    expect(screen.getByText("Onaydan sonra sisteme katıl")).toBeInTheDocument();
  });

  it("warns when the password is too short", async () => {
    const user = userEvent.setup();
    render(<RegisterView />);

    await user.type(screen.getByLabelText("Şifre *"), "kisa");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Şifre en az 8 karakter olmalı.",
    );
  });

  it("warns when the two passwords differ", async () => {
    const user = userEvent.setup();
    render(<RegisterView />);

    await user.type(screen.getByLabelText("Şifre *"), "sifre1234");
    await user.type(screen.getByLabelText(/Şifre tekrar/), "baskasifre");

    expect(screen.getByRole("alert")).toHaveTextContent("Şifreler eşleşmiyor.");
  });

  it("only lets the mentee continue to onboarding once the form is valid", async () => {
    const user = userEvent.setup();
    render(<RegisterView />);

    const cta = screen.getByRole("link", {
      name: "Hesap oluştur ve devam et",
    });
    expect(cta).toHaveAttribute("aria-disabled", "true");

    await fillAll(user);

    expect(cta).toHaveAttribute("aria-disabled", "false");
    expect(cta).toHaveAttribute("href", "/signup");
  });

  it("links back to the login screen", () => {
    render(<RegisterView />);

    expect(screen.getByRole("link", { name: "Giriş yap" })).toHaveAttribute(
      "href",
      "/auth/login",
    );
  });
});
