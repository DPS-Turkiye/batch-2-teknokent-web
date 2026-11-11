import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MobileLoginPage from "@/app/m/login/page";
import {
  requestPasswordReset,
  signInToFirebase,
  signOutOfFirebase,
} from "@/lib/firebase/auth";
import { InLocale } from "@test/test-utils";

const push = vi.fn();
const replace = vi.fn();
const login = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => searchParams,
}));

vi.mock("next/link", () => import("@test/mocks/next-link"));

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ login, logout: vi.fn() }),
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

async function signIn(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("E-posta"), "gamze@atlasai.co");
  await user.type(screen.getByLabelText("Şifre"), "sifre1234");
  await user.click(screen.getByRole("button", { name: "Giriş Yap" }));
}

function otgLink() {
  return screen
    .queryAllByRole("link")
    .find((link) => link.getAttribute("href")?.startsWith("/auth/otg/start"));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(signInToFirebase).mockResolvedValue("id-token");
  vi.mocked(signOutOfFirebase).mockResolvedValue(undefined);
  login.mockResolvedValue({});
  searchParams = new URLSearchParams();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Phone login", () => {
  // Phones are sent here from /login, so the OTG sign-in must be offered here too.
  it("offers the OTG sign-in when it is switched on, keeping where the visitor was headed", () => {
    vi.stubEnv("NEXT_PUBLIC_OTG_LOGIN_ENABLED", "true");
    searchParams = new URLSearchParams("next=/m/mentorships");
    render(<MobileLoginPage />);

    expect(otgLink()).toHaveAttribute(
      "href",
      "/auth/otg/start?next=%2Fm%2Fmentorships",
    );
  });

  it("shows no OTG sign-in while it is switched off", () => {
    vi.stubEnv("NEXT_PUBLIC_OTG_LOGIN_ENABLED", undefined);
    render(<MobileLoginPage />);

    expect(otgLink()).toBeUndefined();
  });

  it("says when an earlier OTG attempt could not start", () => {
    vi.stubEnv("NEXT_PUBLIC_OTG_LOGIN_ENABLED", "true");
    searchParams = new URLSearchParams("otg=hata");
    render(<MobileLoginPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("tamamlanamadı");
  });

  it("renders the login frame with a web sign-up link", () => {
    render(<MobileLoginPage />);

    expect(
      screen.getByRole("heading", { name: "Hesabınıza giriş yapın" }),
    ).toBeInTheDocument();
    const signUp = screen.getByRole("link", {
      name: /Web üzerinden kayıt olun/,
    });
    expect(signUp).toHaveAttribute("href", "/signup?web=1");
    // A next/link would be prefetched while the login is on screen.
    expect(signUp).not.toHaveAttribute("data-next-link");
  });

  it("renders the login frame in English", async () => {
    const user = userEvent.setup();
    render(
      <InLocale locale="en">
        <MobileLoginPage />
      </InLocale>,
    );

    expect(
      screen.getByRole("heading", { name: "Sign in to your account" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Sign up on the web/ }),
    ).toHaveAttribute("href", "/signup?web=1");

    await user.click(screen.getByRole("button", { name: "Forgot password" }));
    expect(
      screen.getByRole("dialog", { name: "Reset your password" }),
    ).toHaveTextContent("We'll send a reset link");
  });

  it("opens the phone home after signing in", async () => {
    const user = userEvent.setup();
    render(<MobileLoginPage />);

    await signIn(user);

    expect(signInToFirebase).toHaveBeenCalledWith(
      "gamze@atlasai.co",
      "sifre1234",
      false,
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/m"));
  });

  it("returns to the phone screen the visitor was headed to", async () => {
    searchParams = new URLSearchParams({ next: "/m/tasks" });
    const user = userEvent.setup();
    render(<MobileLoginPage />);

    await signIn(user);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/m/tasks"));
  });

  it("marks the password field and explains a failed sign-in", async () => {
    vi.mocked(signInToFirebase).mockRejectedValue(new Error("wrong"));
    const user = userEvent.setup();
    render(<MobileLoginPage />);

    await signIn(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-posta veya şifre hatalı.",
    );
    expect(screen.getByLabelText("Şifre")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows and hides the password", async () => {
    const user = userEvent.setup();
    render(<MobileLoginPage />);
    const password = screen.getByLabelText("Şifre");

    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Şifreyi göster" }));
    expect(password).toHaveAttribute("type", "text");
  });

  it("explains why sign-up happens on the web", async () => {
    const user = userEvent.setup();
    render(<MobileLoginPage />);

    await user.click(
      screen.getByRole("button", { name: /Henüz Menton hesabınız yok mu/ }),
    );

    const sheet = screen.getByRole("dialog", { name: "Kayıt neden web’de?" });
    expect(sheet).toHaveTextContent("koordinatör onayından sonra açılır");
    await user.click(screen.getByRole("button", { name: "Kapat" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sends a password reset link from the sheet", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<MobileLoginPage />);

    await user.click(screen.getByRole("button", { name: "Şifremi unuttum" }));
    const sheet = screen.getByRole("dialog", { name: "Şifreni sıfırla" });
    await user.type(
      screen.getByLabelText("E-posta", { selector: "#mobile-reset-email" }),
      "gamze@atlasai.co",
    );
    await user.click(screen.getByRole("button", { name: "Bağlantı gönder" }));

    expect(requestPasswordReset).toHaveBeenCalledWith("gamze@atlasai.co");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Şifre sıfırlama bağlantısı",
    );
    expect(sheet).toBeInTheDocument();
  });
});
