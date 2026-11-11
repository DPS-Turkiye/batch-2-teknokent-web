import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OdtuLoginButton } from "@/components/login/odtu-login-button";
import { assignLocation } from "@/lib/assign-location";
import { startInstitutionLogin } from "@/lib/client/institution-login";
import { InLocale } from "@test/test-utils";

vi.mock("@/lib/assign-location", () => ({
  assignLocation: vi.fn(),
}));

vi.mock("@/lib/client/institution-login", () => ({
  startInstitutionLogin: vi.fn(),
}));

describe("ODTÜ login button", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  // There is no real ODTÜ login yet, so nobody outside local development sees the button.
  it("stays hidden unless the dev login is switched on", () => {
    render(<OdtuLoginButton />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("starts the ODTÜ login and follows the backend's redirect", async () => {
    vi.stubEnv("NEXT_PUBLIC_ODTU_DEV_LOGIN", "true");
    vi.mocked(assignLocation).mockReset();
    vi.mocked(startInstitutionLogin).mockResolvedValue({
      redirectUrl: "/login/odtu/dev?state=s-1",
      state: "s-1",
    });
    const user = userEvent.setup();
    render(
      <InLocale locale="tr">
        <OdtuLoginButton />
      </InLocale>,
    );

    await user.click(
      screen.getByRole("button", { name: "ODTÜ Hesabıyla Giriş Yap" }),
    );

    expect(startInstitutionLogin).toHaveBeenCalledWith("odtu");
    expect(assignLocation).toHaveBeenCalledWith("/login/odtu/dev?state=s-1");
  });
});
