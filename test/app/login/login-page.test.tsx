import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";
import { ClientApiError } from "@/lib/client/api";
import {
  requestPasswordReset,
  signInToFirebase,
  signOutOfFirebase,
} from "@/lib/firebase/auth";

const push = vi.fn();
const login = vi.fn();
const logout = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ login, logout }),
}));

vi.mock("@/lib/firebase/auth", () => ({
  signInToFirebase: vi.fn(),
  requestPasswordReset: vi.fn(),
  signOutOfFirebase: vi.fn(),
  describeAuthError: () => "E-posta veya şifre hatalı.",
  isCurrentEmailVerified: () => true,
  currentIdToken: vi.fn(),
  reloadAndCheckEmailVerified: vi.fn(),
  resendVerificationEmail: vi.fn(),
}));

async function fillCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/E-posta/), "gulse@dongu.co");
  await user.type(screen.getByLabelText(/Şifre/), "sifre1234");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(signInToFirebase).mockResolvedValue("id-token");
  vi.mocked(signOutOfFirebase).mockResolvedValue(undefined);
  logout.mockResolvedValue(undefined);
});

async function waitUntilLoginReady() {
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Giriş yap" })).toBeEnabled(),
  );
}

describe("Login screen", () => {
  it("does not sign anyone out just because the login page opened", async () => {
    render(<LoginPage />);
    await waitUntilLoginReady();

    // The cookie and the Firebase session are shared across tabs, so logging
    // out here signed out an authenticated tab elsewhere.
    expect(logout).not.toHaveBeenCalled();
    expect(signOutOfFirebase).not.toHaveBeenCalled();
  });

  it("renders the shared login frame", async () => {
    render(<LoginPage />);
    await waitUntilLoginReady();

    expect(
      screen.getByRole("heading", { name: "METUal'a hoş geldin" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/E-posta/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Şifre/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Şifremi unuttum" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Beni Hatırla")).toBeInTheDocument();
  });

  it("masks the password field", async () => {
    render(<LoginPage />);
    await waitUntilLoginReady();

    expect(screen.getByLabelText(/Şifre/)).toHaveAttribute("type", "password");
  });

  it("offers both join routes and the invite route to new users", async () => {
    render(<LoginPage />);
    await waitUntilLoginReady();

    expect(
      screen.getByRole("link", { name: /Startup'ımla katıl/ }),
    ).toHaveAttribute("href", "/signup");
    expect(
      screen.getByRole("link", { name: /Mentor olmak istiyorum/ }),
    ).toHaveAttribute("href", "/signup?role=mentor");
    expect(
      screen.getByRole("link", {
        name: "Bir davet aldın mı? Davet kodunla devam et",
      }),
    ).toHaveAttribute("href", "/invite");
  });

  it("signs in through Firebase and continues to the workspace", async () => {
    login.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginPage />);
    await waitUntilLoginReady();

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    await waitFor(() =>
      expect(signInToFirebase).toHaveBeenCalledWith(
        "gulse@dongu.co",
        "sifre1234",
        false,
      ),
    );
    await waitFor(() => expect(login).toHaveBeenCalledWith("id-token", false));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
  });

  it("passes Beni Hatırla through as the persistence choice", async () => {
    login.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginPage />);
    await waitUntilLoginReady();

    await user.click(screen.getByLabelText("Beni Hatırla"));
    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    await waitFor(() =>
      expect(signInToFirebase).toHaveBeenCalledWith(
        "gulse@dongu.co",
        "sifre1234",
        true,
      ),
    );
    await waitFor(() => expect(login).toHaveBeenCalledWith("id-token", true));
  });

  it("surfaces wrong credentials without navigating away", async () => {
    vi.mocked(signInToFirebase).mockRejectedValue(new Error("nope"));
    const user = userEvent.setup();
    render(<LoginPage />);
    await waitUntilLoginReady();

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-posta veya şifre hatalı.",
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("sends a not-yet-approved account to the status page, still signed in", async () => {
    login.mockRejectedValue(
      new ClientApiError(
        "Hesabınız koordinatör onayı bekliyor.",
        403,
        "ACCOUNT_NOT_APPROVED",
      ),
    );
    const user = userEvent.setup();
    render(<LoginPage />);
    await waitUntilLoginReady();

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/application-status"),
    );
    // The Firebase session has to survive, or the status page has no token.
    expect(signOutOfFirebase).not.toHaveBeenCalled();
  });

  it("still signs the user out for a rejection without that code", async () => {
    login.mockRejectedValue(
      new ClientApiError("Bu hesabın kaydı tamamlanmamış.", 401),
    );
    const user = userEvent.setup();
    render(<LoginPage />);
    await waitUntilLoginReady();

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Bu hesabın kaydı tamamlanmamış.",
    );
    await waitFor(() => expect(signOutOfFirebase).toHaveBeenCalled());
    expect(push).not.toHaveBeenCalled();
  });

  it("resumes an interrupted signup instead of stranding the account", async () => {
    login.mockRejectedValue(
      new ClientApiError(
        "Bu hesabın kaydı tamamlanmamış.",
        401,
        "REGISTRATION_REQUIRED",
      ),
    );
    const user = userEvent.setup();
    render(<LoginPage />);
    await waitUntilLoginReady();

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/signup?resume=1"));
    expect(signOutOfFirebase).not.toHaveBeenCalled();
  });

  it("refuses an email that contains ı before calling Firebase", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await waitUntilLoginReady();

    await user.type(screen.getByLabelText(/E-posta/), "sude@gmaıl.com");
    await user.type(screen.getByLabelText(/Şifre/), "sifre1234");
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/ı yerine i/);
    expect(signInToFirebase).not.toHaveBeenCalled();
  });

  it("sends a reset link for the typed email", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/E-posta/), "gulse@dongu.co");
    await user.click(screen.getByRole("button", { name: "Şifremi unuttum" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.",
    );
    expect(requestPasswordReset).toHaveBeenCalledWith("gulse@dongu.co");
  });

  it("asks for an email before sending a reset link", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Şifremi unuttum" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Şifre sıfırlama bağlantısı için e-posta adresinizi girin.",
    );
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });
});
