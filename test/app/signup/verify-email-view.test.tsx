import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VerifyEmailView } from "@/components/auth/verify-email-view";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { Locale } from "@/lib/i18n";
import {
  reloadAndCheckEmailVerified,
  resendVerificationEmail,
} from "@/lib/firebase/auth";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/firebase/auth", () => ({
  reloadAndCheckEmailVerified: vi.fn(),
  resendVerificationEmail: vi.fn(),
  describeAuthError: () => "Kimlik doğrulama tamamlanamadı.",
}));

describe("VerifyEmailView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reloadAndCheckEmailVerified).mockResolvedValue(false);
    vi.mocked(resendVerificationEmail).mockResolvedValue(undefined);
  });

  it("says the verification mail was sent and can resend it", async () => {
    const user = userEvent.setup();
    render(<VerifyEmailView email="gulse@dongu.co" onVerified={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "E-postanı doğrula" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/gulse@dongu.co/)).toBeInTheDocument();
    expect(screen.getByText(/doğrulama linki gönderdik/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yeniden gönder" }));
    await waitFor(() =>
      expect(resendVerificationEmail).toHaveBeenCalledTimes(1),
    );
    expect(screen.getByRole("status")).toHaveTextContent(/yeniden gönderdik/);
  });

  it("reads in English when that is the chosen language", () => {
    render(
      <LocaleProvider locale={Locale.En}>
        <VerifyEmailView email="gulse@dongu.co" onVerified={vi.fn()} />
      </LocaleProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Verify your email" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/We sent a verification link to/),
    ).toHaveTextContent(
      "We sent a verification link to gulse@dongu.co. Click the link in the email to continue.",
    );
    expect(
      screen.getByRole("button", { name: "Send again" }),
    ).toBeInTheDocument();
  });

  it("continues only after Firebase says the address is verified", async () => {
    const onVerified = vi.fn().mockResolvedValue(undefined);
    vi.mocked(reloadAndCheckEmailVerified).mockResolvedValue(true);
    const user = userEvent.setup();
    render(<VerifyEmailView email="gulse@dongu.co" onVerified={onVerified} />);

    await user.click(
      screen.getByRole("button", { name: "Maili doğruladım, devam et" }),
    );
    await waitFor(() => expect(onVerified).toHaveBeenCalledTimes(1));
  });
});
