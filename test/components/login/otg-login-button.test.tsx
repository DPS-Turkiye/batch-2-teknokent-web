import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OtgLoginButton } from "@/components/login/otg-login-button";
import { InLocale } from "@test/test-utils";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

function renderButton(next: string | null = null) {
  return render(
    <InLocale locale="tr">
      <OtgLoginButton next={next} />
    </InLocale>,
  );
}

describe("OTG login button", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Only a deployment registered with OTG turns it on; Teknokent prod does not.
  it("stays hidden unless OTG login is switched on", () => {
    renderButton();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("links to the start path, carrying where the visitor was headed", () => {
    vi.stubEnv("NEXT_PUBLIC_OTG_LOGIN_ENABLED", "true");
    renderButton("/programs/42");

    expect(
      screen.getByRole("link", {
        name: "ODTÜ TEKNOKENT Girişimcilik ile giriş yap",
      }),
    ).toHaveAttribute("href", "/auth/otg/start?next=%2Fprograms%2F42");
  });

  it("says when an earlier OTG attempt could not start", () => {
    vi.stubEnv("NEXT_PUBLIC_OTG_LOGIN_ENABLED", "true");
    searchParams = new URLSearchParams("otg=hata");
    renderButton();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "ODTÜ TEKNOKENT Girişimcilik ile giriş tamamlanamadı.",
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/auth/otg/start");
  });
});
