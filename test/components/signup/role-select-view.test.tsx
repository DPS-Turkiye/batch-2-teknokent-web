import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/components/providers/locale-provider";
import { RoleSelectView } from "@/components/signup/role-select-view";
import { SignupRole } from "@/interfaces/signup";
import { Locale } from "@/lib/i18n";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/hooks/use-onboarding-exit", () => ({
  useOnboardingExit: () => ({ exit: vi.fn(), exiting: false }),
}));

describe("RoleSelectView", () => {
  it("offers both roles in Turkish and passes the choice on", async () => {
    const user = userEvent.setup();
    const onChoose = vi.fn();
    render(<RoleSelectView signedIn={false} onChoose={onChoose} />);

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
      <LocaleProvider locale={Locale.En}>
        <RoleSelectView signedIn={false} onChoose={vi.fn()} />
      </LocaleProvider>,
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
