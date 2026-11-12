import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RoleSelectView } from "@/components/signup/role-select-view";
import { Edition } from "@/interfaces/edition";
import { SignupRole } from "@/interfaces/signup";
import { InLocale } from "@test/test-utils";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/hooks/use-onboarding-exit", () => ({
  useOnboardingExit: () => ({ exit: vi.fn(), exiting: false }),
}));

describe("RoleSelectView", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("offers ODTÜ its own sign-in and one İŞKUR student card, with no mentor card or invite code", async () => {
    vi.stubEnv("NEXT_PUBLIC_ODTU_DEV_LOGIN", "true");
    const user = userEvent.setup();
    const onChoose = vi.fn();
    render(
      <InLocale locale="tr">
        <RoleSelectView
          edition={Edition.Odtu}
          signedIn={false}
          onChoose={onChoose}
        />
      </InLocale>,
    );

    expect(
      screen.getByRole("region", {
        name: "ODTÜ öğrencisi veya akademisyeni misin?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ODTÜ Hesabıyla Giriş Yap" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Akran mentoru olmak istiyorum" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Mentor olarak devam et")).toBeNull();
    expect(screen.queryByText("Girişimci olarak devam et")).toBeNull();
    expect(screen.queryByRole("link", { name: /Kodunla/ })).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "İŞKUR öğrencisi olarak devam et" }),
    );
    expect(onChoose).toHaveBeenCalledWith(SignupRole.Founder);
  });

  it("leaves the ODTÜ banner out while no institution login is wired", () => {
    render(
      <RoleSelectView
        edition={Edition.Odtu}
        signedIn={false}
        onChoose={vi.fn()}
      />,
    );

    expect(screen.queryByRole("region", { name: /ODTÜ öğrencisi/ })).toBeNull();
    expect(
      screen.getByText("İŞKUR öğrencisi olarak devam et"),
    ).toBeInTheDocument();
  });

  it("keeps Teknokent's founder and mentor cards and the invite code, without ODTÜ", () => {
    vi.stubEnv("NEXT_PUBLIC_ODTU_DEV_LOGIN", "true");
    render(
      <RoleSelectView
        edition={Edition.Teknokent}
        signedIn={false}
        onChoose={vi.fn()}
      />,
    );

    expect(screen.getByText("Girişimci olarak devam et")).toBeInTheDocument();
    expect(screen.getByText("Mentor olarak devam et")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kodunla/ })).toHaveAttribute(
      "href",
      "/invite",
    );
    expect(screen.queryByRole("region", { name: /ODTÜ öğrencisi/ })).toBeNull();
  });

  it("offers both roles in Turkish and passes the choice on", async () => {
    const user = userEvent.setup();
    const onChoose = vi.fn();
    render(
      <RoleSelectView
        edition={Edition.Teknokent}
        signedIn={false}
        onChoose={onChoose}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "menton’a nasıl katılmak istiyorsun?",
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Mentor olarak devam et" }),
    );
    expect(onChoose).toHaveBeenCalledWith(SignupRole.Mentor);
  });

  it("reads in English when that is the chosen language", () => {
    render(
      <InLocale locale="en">
        <RoleSelectView
          edition={Edition.Teknokent}
          signedIn={false}
          onChoose={vi.fn()}
        />
      </InLocale>,
    );

    expect(
      screen.getByRole("heading", {
        name: "How would you like to join menton?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue as a founder" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
