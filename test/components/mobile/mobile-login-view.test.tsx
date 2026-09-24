import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MobileLoginPage from "@/app/m/login/page";
import {
  requestPasswordReset,
  signInToFirebase,
  signOutOfFirebase,
} from "@/lib/firebase/auth";

const push = vi.fn();
const replace = vi.fn();
const login = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => searchParams,
}));

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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(signInToFirebase).mockResolvedValue("id-token");
  vi.mocked(signOutOfFirebase).mockResolvedValue(undefined);
  login.mockResolvedValue({});
  searchParams = new URLSearchParams();
});

describe("Phone login", () => {
  it("renders the login frame with a web sign-up link", () => {
    render(<MobileLoginPage />);

    expect(
      screen.getByRole("heading", { name: "Hesabınıza giriş yapın" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Web üzerinden kayıt olun/ }),
    ).toHaveAttribute("href", "/signup?web=1");
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
