import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";
import { ClientApiError } from "@/lib/client/api";
import { fetchOnboardingDraft } from "@/lib/client/onboarding-draft";
import {
  currentIdToken,
  isCurrentEmailVerified,
  reloadAndCheckEmailVerified,
  requestPasswordReset,
  signInToFirebase,
  signOutOfFirebase,
} from "@/lib/firebase/auth";
import { InLocale } from "@test/test-utils";

const push = vi.fn();
const login = vi.fn();
const logout = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ login, logout }),
}));

vi.mock("@/lib/client/onboarding-draft", () => ({
  fetchOnboardingDraft: vi.fn(),
}));

vi.mock("@/lib/firebase/auth", () => ({
  signInToFirebase: vi.fn(),
  requestPasswordReset: vi.fn(),
  signOutOfFirebase: vi.fn(),
  describeAuthError: () => "E-posta veya şifre hatalı.",
  isCurrentEmailVerified: vi.fn(),
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
  vi.mocked(isCurrentEmailVerified).mockReturnValue(true);
  vi.mocked(fetchOnboardingDraft).mockResolvedValue(null);
  vi.mocked(signOutOfFirebase).mockResolvedValue(undefined);
  logout.mockResolvedValue(undefined);
  searchParams = new URLSearchParams();
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

  it("shows the login screen in English when that is the chosen language", async () => {
    render(
      <InLocale locale="en">
        <LoginPage />
      </InLocale>,
    );

    expect(
      await screen.findByRole("heading", { name: "Welcome to Menton" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  it("renders the shared login frame", async () => {
    const { container } = render(<LoginPage />);
    await waitUntilLoginReady();

    // A single centred form, without the orange side panel.
    expect(container.querySelector("img")).toBeNull();

    expect(
      screen.getByRole("heading", { name: "Menton’a hoş geldin" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/E-posta/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Şifre/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Şifremi unuttum" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Beni Hatırla")).not.toBeInTheDocument();
  });

  it("masks the password field", async () => {
    render(<LoginPage />);
    await waitUntilLoginReady();

    expect(screen.getByLabelText(/Şifre/)).toHaveAttribute("type", "password");
  });

  it("sends new users to the role page and keeps the invite route", async () => {
    render(<LoginPage />);
    await waitUntilLoginReady();

    expect(screen.getByText("Menton’a yeni misin?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kayıt Ol" })).toHaveAttribute(
      "href",
      "/signup",
    );
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
    await waitFor(() => expect(login).toHaveBeenCalledWith("id-token"));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
  });

  it("continues to where the gate was sending them, not the workspace", async () => {
    searchParams = new URLSearchParams({ next: "/mentorships" });
    login.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginPage />);
    await waitUntilLoginReady();

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/mentorships"));
    expect(push).not.toHaveBeenCalledWith("/workspace");
  });

  it("refuses a next that would send the visitor off the site", async () => {
    searchParams = new URLSearchParams({ next: "//evil.example/steal" });
    login.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginPage />);
    await waitUntilLoginReady();

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
    expect(push).not.toHaveBeenCalledWith("//evil.example/steal");
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

  it("sends a not-yet-approved account to the status page after it verifies its e-mail", async () => {
    vi.mocked(isCurrentEmailVerified).mockReturnValue(false);
    vi.mocked(reloadAndCheckEmailVerified).mockResolvedValue(true);
    vi.mocked(currentIdToken).mockResolvedValue("fresh-token");
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
    await user.click(
      await screen.findByRole("button", { name: "Maili doğruladım, devam et" }),
    );

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/application-status"),
    );
    expect(login).toHaveBeenCalledWith("fresh-token");
    expect(fetchOnboardingDraft).toHaveBeenCalledWith("fresh-token");
    expect(signOutOfFirebase).not.toHaveBeenCalled();
  });

  it("reopens a pending mentor's saved signup instead of the status page", async () => {
    login.mockRejectedValue(
      new ClientApiError(
        "Hesabınız koordinatör onayı bekliyor.",
        403,
        "ACCOUNT_NOT_APPROVED",
      ),
    );
    vi.mocked(fetchOnboardingDraft).mockResolvedValue({
      kind: "mentor-onboarding",
      step: "profile",
      payload: {},
    });
    const user = userEvent.setup();
    render(<LoginPage />);
    await waitUntilLoginReady();

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/signup?resume=1&role=mentor"),
    );
    expect(fetchOnboardingDraft).toHaveBeenCalledWith("id-token");
    expect(signOutOfFirebase).not.toHaveBeenCalled();
  });

  it("resumes a founder's saved signup straight in the founder wizard", async () => {
    login.mockRejectedValue(
      new ClientApiError(
        "Bu hesabın kaydı tamamlanmamış.",
        401,
        "REGISTRATION_REQUIRED",
      ),
    );
    vi.mocked(fetchOnboardingDraft).mockResolvedValue({
      kind: "signup-wizard",
      step: "2",
      payload: {},
    });
    const user = userEvent.setup();
    render(<LoginPage />);
    await waitUntilLoginReady();

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/signup?resume=1&role=founder"),
    );
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
