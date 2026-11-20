import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InviteView } from "@/components/auth/invite-view";
import { LoginFlowView } from "@/components/login/login-flow-view";
import { Edition } from "@/interfaces/edition";
import { ClientApiError } from "@/lib/client/api";
import { registerMember } from "@/lib/client/auth";
import { createFirebaseAccount } from "@/lib/firebase/auth";
import { InLocale } from "@test/test-utils";

/**
 * The journey members got stuck on since BE #152 (8 Nov) made registerMember require a verified address:
 * /invite made the login, the member left to verify it elsewhere, and their next sign-in went to the founder and
 * mentor sign-up. Back on /invite, a second login for the same address failed with "email already in use".
 * Firebase and the backend are faked in memory; the screens, hooks and routing are the real ones.
 */

const push = vi.fn();
let searchParams = new URLSearchParams();

type Login = { email: string; verified: boolean };
const firebase = vi.hoisted(() => ({
  logins: new Map<string, { email: string; verified: boolean }>(),
  signedIn: null as { email: string; verified: boolean } | null,
  emailInUse: new Error("auth/email-already-in-use"),
}));
const backend = vi.hoisted(() => ({ accounts: new Set<string>() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
}));
vi.mock("next/link", () => import("@test/mocks/next-link"));
vi.mock("@/components/auth/verify-email-view", () => ({
  VerifyEmailView: ({ email }: { email: string }) => <p>verify {email}</p>,
}));
vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({
    login: async () => {
      const email = firebase.signedIn?.email ?? "";
      if (!backend.accounts.has(email)) {
        throw new ClientApiError(
          "Bu hesabın kaydı tamamlanmamış.",
          401,
          "REGISTRATION_REQUIRED",
        );
      }
      return {};
    },
    logout: vi.fn(),
  }),
}));
vi.mock("@/lib/client/onboarding-draft", () => ({
  clearOnboardingDraft: vi.fn().mockResolvedValue(undefined),
  fetchOnboardingDraft: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/client/invite-code", () => ({
  checkInviteCode: vi.fn().mockResolvedValue({
    valid: true,
    teamName: "Yıldız Team",
  }),
}));
vi.mock("@/lib/client/auth", () => ({
  registerMember: vi.fn(async (input: { email: string }) => {
    backend.accounts.add(input.email);
    return {};
  }),
}));
vi.mock("@/lib/firebase/auth", () => ({
  createFirebaseAccount: vi.fn(async (email: string) => {
    if (firebase.logins.has(email)) throw firebase.emailInUse;
    const login: Login = { email, verified: false };
    firebase.logins.set(email, login);
    firebase.signedIn = login;
    return "id-token";
  }),
  signInToFirebase: vi.fn(async (email: string) => {
    firebase.signedIn = firebase.logins.get(email) ?? null;
    return "id-token";
  }),
  isCurrentEmailVerified: () => firebase.signedIn?.verified ?? false,
  currentSignedInAccount: async () =>
    firebase.signedIn
      ? {
          email: firebase.signedIn.email,
          fullName: "",
          verified: firebase.signedIn.verified,
          otg: false,
        }
      : null,
  currentIdToken: async () => (firebase.signedIn ? "id-token" : null),
  isEmailAlreadyInUse: (error: unknown) => error === firebase.emailInUse,
  describeAuthError: (error: unknown) =>
    error instanceof Error ? error.message : "Kimlik doğrulama tamamlanamadı.",
  signOutOfFirebase: vi.fn(async () => {
    firebase.signedIn = null;
  }),
  requestPasswordReset: vi.fn(),
  reloadAndCheckEmailVerified: vi.fn(),
  resendVerificationEmail: vi.fn(),
}));

function field(id: string) {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement)) throw new Error(`no #${id}`);
  return element;
}

function renderInvite() {
  return render(
    <InLocale locale="tr">
      <InviteView />
    </InLocale>,
  );
}

describe("Joining a team with a code across e-mail verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    firebase.logins.clear();
    firebase.signedIn = null;
    backend.accounts.clear();
    searchParams = new URLSearchParams();
  });

  it("makes the login on /invite, leaves to verify, signs in later and finishes on /invite with the code", async () => {
    const user = userEvent.setup();

    // 1. /invite: the code is fine, the login is made, and the address still needs verifying.
    const invite = renderInvite();
    await user.type(field("invite-code"), "ABCD1234");
    await user.type(field("invite-first-name"), "Deniz");
    await user.type(field("invite-last-name"), "Kaya");
    await user.type(field("invite-email"), "deniz@ornek.com");
    await user.type(field("invite-phone"), "+905551112233");
    await user.type(field("invite-password"), "Guclu-sifre-123");
    await user.type(field("invite-password-confirm"), "Guclu-sifre-123");
    await user.click(screen.getByRole("button", { name: "Ekibe katıl" }));
    expect(
      await screen.findByText("verify deniz@ornek.com"),
    ).toBeInTheDocument();

    // 2. They leave, verify the address from their phone, and the tab's session is gone.
    invite.unmount();
    const login = firebase.logins.get("deniz@ornek.com");
    if (!login) throw new Error("the login was not made");
    login.verified = true;
    firebase.signedIn = null;
    expect(backend.accounts.has("deniz@ornek.com")).toBe(false);

    // 3. Later they sign in. No account yet: they are sent back to /invite with their code, not to /signup.
    const loginScreen = render(
      <InLocale locale="tr">
        <LoginFlowView edition={Edition.Teknokent} />
      </InLocale>,
    );
    await user.type(screen.getByLabelText(/E-posta/), "deniz@ornek.com");
    await user.type(screen.getByLabelText(/Şifre/), "Guclu-sifre-123");
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/invite?code=ABCD1234&resume=1"),
    );
    expect(push).not.toHaveBeenCalledWith(expect.stringContaining("/signup"));
    loginScreen.unmount();

    // 4. Back on /invite: the code is filled in and the signed-in login joins; no second login is made.
    searchParams = new URLSearchParams({ code: "ABCD1234", resume: "1" });
    renderInvite();
    expect(field("invite-code")).toHaveValue("ABCD1234");
    expect(await screen.findByText("deniz@ornek.com")).toBeInTheDocument();
    await user.type(field("invite-first-name"), "Deniz");
    await user.type(field("invite-last-name"), "Kaya");
    await user.type(field("invite-phone"), "+905551112233");
    await user.click(screen.getByRole("button", { name: "Ekibe katıl" }));

    await waitFor(() => expect(push).toHaveBeenLastCalledWith("/workspace"));
    expect(createFirebaseAccount).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/zaten bir giriş var/)).not.toBeInTheDocument();
    expect(registerMember).toHaveBeenCalledWith(
      {
        fullName: "Deniz Kaya",
        email: "deniz@ornek.com",
        inviteCode: "ABCD1234",
        phone: "+905551112233",
      },
      "id-token",
    );
    expect(backend.accounts.has("deniz@ornek.com")).toBe(true);
  });
});
