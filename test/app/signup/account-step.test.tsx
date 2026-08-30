import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RegisterView } from "@/components/auth/register-view";

vi.mock("@/lib/firebase/auth", () => ({
  describeAuthError: () => "Authentication could not be completed.",
}));

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
    render(<RegisterView onSubmit={vi.fn()} />);

    expect(screen.getByText("Nasıl çalışır?")).toBeInTheDocument();
    expect(screen.getByText("Hesabını oluştur")).toBeInTheDocument();
    expect(screen.getByText("Startup profilini tamamla")).toBeInTheDocument();
    expect(screen.getByText("Koordinatör onayını bekle")).toBeInTheDocument();
    expect(
      screen.getByText("Onaydan sonra ekibini davet et"),
    ).toBeInTheDocument();
  });

  it("warns when the password is too short", async () => {
    const user = userEvent.setup();
    render(<RegisterView onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText("Şifre *"), "kisa");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Password must be at least 8 characters.",
    );
  });

  it("warns when the two passwords differ", async () => {
    const user = userEvent.setup();
    render(<RegisterView onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText("Şifre *"), "sifre1234");
    await user.type(screen.getByLabelText(/Şifre tekrar/), "baskasifre");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Passwords do not match.",
    );
  });

  it("submits the collected form only once it is valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RegisterView onSubmit={onSubmit} />);

    const cta = screen.getByRole("button", {
      name: "Hesap oluştur ve devam et",
    });
    expect(cta).toBeDisabled();

    await fillAll(user);
    expect(cta).toBeEnabled();

    await user.click(cta);
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "Gülse",
          lastName: "Buran",
          email: "gulse@dongu.co",
          phone: "+905551112233",
        }),
      ),
    );
  });

  it("keeps the user on the form when account creation fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("boom"));
    render(<RegisterView onSubmit={onSubmit} />);

    await fillAll(user);
    await user.click(
      screen.getByRole("button", { name: "Hesap oluştur ve devam et" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Authentication could not be completed.",
    );
    expect(
      screen.getByRole("button", { name: "Hesap oluştur ve devam et" }),
    ).toBeEnabled();
  });

  it("links back to the existing login route", () => {
    render(<RegisterView onSubmit={vi.fn()} />);

    expect(screen.getByRole("link", { name: "Giriş yap" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
