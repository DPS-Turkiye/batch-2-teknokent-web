import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InviteView } from "@/components/auth/invite-view";
import { ClientApiError } from "@/lib/client/api";
import { registerMember } from "@/lib/client/auth";
import { checkInviteCode } from "@/lib/client/invite-code";
import {
  createFirebaseAccount,
  currentIdToken,
  currentSignedInAccount,
  isCurrentEmailVerified,
  isEmailAlreadyInUse,
  signOutOfFirebase,
} from "@/lib/firebase/auth";
import { readInviteIntent, saveInviteIntent } from "@/lib/invite-intent";
import { InLocale } from "@test/test-utils";

const push = vi.fn();
const login = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
}));
vi.mock("next/link", () => import("@test/mocks/next-link"));
vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ login }),
}));
vi.mock("@/components/auth/verify-email-view", () => ({
  VerifyEmailView: ({ email }: { email: string }) => <p>verify {email}</p>,
}));
vi.mock("@/lib/client/auth", () => ({
  registerMember: vi.fn(),
}));
vi.mock("@/lib/client/invite-code", () => ({
  checkInviteCode: vi.fn(),
}));
vi.mock("@/lib/firebase/auth", () => ({
  createFirebaseAccount: vi.fn(),
  currentIdToken: vi.fn(),
  currentSignedInAccount: vi.fn(),
  isCurrentEmailVerified: vi.fn(),
  isEmailAlreadyInUse: vi.fn(),
  signOutOfFirebase: vi.fn(),
  describeAuthError: (error: unknown) =>
    error instanceof Error ? error.message : "Kimlik doğrulama tamamlanamadı.",
}));

function field(id: string) {
  return document.getElementById(id) as HTMLInputElement | null;
}

function renderInvite() {
  return render(
    <InLocale locale="tr">
      <InviteView />
    </InLocale>,
  );
}

describe("Invite code sign-up", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    searchParams = new URLSearchParams();
    vi.mocked(currentSignedInAccount).mockResolvedValue(null);
    vi.mocked(checkInviteCode).mockResolvedValue({
      valid: true,
      teamName: "Yıldız Team",
    });
    vi.mocked(isEmailAlreadyInUse).mockReturnValue(false);
    vi.mocked(createFirebaseAccount).mockResolvedValue("id-token");
    vi.mocked(currentIdToken).mockResolvedValue("id-token");
    vi.mocked(isCurrentEmailVerified).mockReturnValue(true);
    vi.mocked(registerMember).mockResolvedValue(
      {} as Awaited<ReturnType<typeof registerMember>>,
    );
    vi.mocked(signOutOfFirebase).mockResolvedValue();
    login.mockResolvedValue({});
  });

  it("creates a new e-mail and password login for everyone else, as before", async () => {
    const user = userEvent.setup();
    renderInvite();

    await user.type(field("invite-code")!, "ABCD1234");
    await user.type(field("invite-first-name")!, "Deniz");
    await user.type(field("invite-last-name")!, "Kaya");
    await user.type(field("invite-email")!, "deniz@ornek.com");
    await user.type(field("invite-phone")!, "+905551112233");
    await user.type(field("invite-password")!, "Guclu-sifre-123");
    await user.type(field("invite-password-confirm")!, "Guclu-sifre-123");
    await user.click(screen.getByRole("button", { name: "Ekibe katıl" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
    expect(createFirebaseAccount).toHaveBeenCalledWith(
      "deniz@ornek.com",
      "Guclu-sifre-123",
    );
    expect(registerMember).toHaveBeenCalledWith(
      {
        fullName: "Deniz Kaya",
        email: "deniz@ornek.com",
        inviteCode: "ABCD1234",
        phone: "+905551112233",
      },
      "id-token",
    );
    expect(
      screen.queryByRole("button", { name: "Başka bir hesapla katıl" }),
    ).not.toBeInTheDocument();
  });

  // The OTG login already holds the address; a second login for it would fail with "email already in use".
  it("joins with the signed-in OTG login: address read-only, no password", async () => {
    vi.mocked(currentSignedInAccount).mockResolvedValue({
      email: "ogrenci@ornek.com",
      fullName: "Ayşe Nur Yılmaz",
      verified: true,
      otg: true,
    });
    const user = userEvent.setup();
    renderInvite();

    expect(await screen.findByText("ogrenci@ornek.com")).toBeInTheDocument();
    expect(field("invite-email")).toBeNull();
    expect(field("invite-password")).toBeNull();
    expect(field("invite-password-confirm")).toBeNull();
    expect(field("invite-first-name")).toHaveValue("Ayşe Nur");
    expect(field("invite-last-name")).toHaveValue("Yılmaz");

    await user.type(field("invite-code")!, "ABCD1234");
    await user.type(field("invite-phone")!, "+905551112233");
    await user.click(screen.getByRole("button", { name: "Ekibe katıl" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
    expect(createFirebaseAccount).not.toHaveBeenCalled();
    expect(registerMember).toHaveBeenCalledWith(
      {
        fullName: "Ayşe Nur Yılmaz",
        email: "ogrenci@ornek.com",
        inviteCode: "ABCD1234",
        phone: "+905551112233",
      },
      "id-token",
    );
    expect(login).toHaveBeenCalledWith("id-token");
  });

  it("lets someone who is not the signed-in OTG person use a new login instead", async () => {
    vi.mocked(currentSignedInAccount).mockResolvedValue({
      email: "ogrenci@ornek.com",
      fullName: "",
      verified: true,
      otg: true,
    });
    const user = userEvent.setup();
    renderInvite();

    await user.click(
      await screen.findByRole("button", { name: "Başka bir hesapla katıl" }),
    );

    expect(signOutOfFirebase).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("ogrenci@ornek.com")).not.toBeInTheDocument();
    expect(field("invite-email")).toHaveValue("");
    expect(field("invite-first-name")).toHaveValue("");
    expect(field("invite-password")).toBeInTheDocument();
  });

  it("asks an OTG login with an unverified address to verify before joining", async () => {
    vi.mocked(currentSignedInAccount).mockResolvedValue({
      email: "ogrenci@ornek.com",
      fullName: "Ayşe Yılmaz",
      verified: false,
      otg: true,
    });
    const user = userEvent.setup();
    renderInvite();

    await screen.findByText("ogrenci@ornek.com");
    await user.type(field("invite-code")!, "ABCD1234");
    await user.type(field("invite-phone")!, "+905551112233");
    await user.click(screen.getByRole("button", { name: "Ekibe katıl" }));

    expect(
      await screen.findByText("verify ogrenci@ornek.com"),
    ).toBeInTheDocument();
    expect(registerMember).not.toHaveBeenCalled();
    expect(createFirebaseAccount).not.toHaveBeenCalled();
    expect(login).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  // Firebase restores the session after first paint; a name typed by then must survive.
  it("never overwrites a name typed before the OTG login is known", async () => {
    let resolveAccount: (value: {
      email: string;
      fullName: string;
      verified: boolean;
      otg: boolean;
    }) => void = () => undefined;
    vi.mocked(currentSignedInAccount).mockReturnValue(
      new Promise((resolve) => {
        resolveAccount = resolve;
      }),
    );
    const user = userEvent.setup();
    renderInvite();

    await user.type(field("invite-first-name")!, "Deniz");
    resolveAccount({
      email: "ogrenci@ornek.com",
      fullName: "Ayşe Yılmaz",
      verified: true,
      otg: true,
    });

    expect(await screen.findByText("ogrenci@ornek.com")).toBeInTheDocument();
    expect(field("invite-first-name")).toHaveValue("Deniz");
    expect(field("invite-last-name")).toHaveValue("Yılmaz");
  });

  it("needs a last name when the OTG name is a single word", async () => {
    vi.mocked(currentSignedInAccount).mockResolvedValue({
      email: "ogrenci@ornek.com",
      fullName: "Ayşe",
      verified: true,
      otg: true,
    });
    const user = userEvent.setup();
    renderInvite();

    await screen.findByText("ogrenci@ornek.com");
    await user.type(field("invite-code")!, "ABCD1234");
    await user.type(field("invite-phone")!, "+905551112233");
    const submit = screen.getByRole("button", { name: "Ekibe katıl" });
    expect(submit).toBeDisabled();

    await user.type(field("invite-last-name")!, "Yılmaz");
    expect(submit).toBeEnabled();
  });

  it("shows the backend's refusal and lets an OTG login try again", async () => {
    vi.mocked(currentSignedInAccount).mockResolvedValue({
      email: "ogrenci@ornek.com",
      fullName: "Ayşe Yılmaz",
      verified: true,
      otg: true,
    });
    vi.mocked(registerMember).mockRejectedValue(
      new ClientApiError("Davet kodu geçersiz.", 400),
    );
    const user = userEvent.setup();
    renderInvite();

    await screen.findByText("ogrenci@ornek.com");
    await user.type(field("invite-code")!, "YANLIS99");
    await user.type(field("invite-phone")!, "+905551112233");
    await user.click(screen.getByRole("button", { name: "Ekibe katıl" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Davet kodu geçersiz.",
    );
    expect(screen.getByRole("button", { name: "Ekibe katıl" })).toBeEnabled();
    expect(login).not.toHaveBeenCalled();
  });

  // Otherwise the new login would only fail with "email already in use".
  it("stays on the OTG login when signing out of it fails", async () => {
    vi.mocked(currentSignedInAccount).mockResolvedValue({
      email: "ogrenci@ornek.com",
      fullName: "",
      verified: true,
      otg: true,
    });
    vi.mocked(signOutOfFirebase).mockRejectedValue(new Error("Ağ hatası"));
    const user = userEvent.setup();
    renderInvite();

    await user.click(
      await screen.findByRole("button", { name: "Başka bir hesapla katıl" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Ağ hatası");
    expect(screen.getByText("ogrenci@ornek.com")).toBeInTheDocument();
    expect(field("invite-password")).toBeNull();
  });

  it("checks the code first and makes no login for a code that opens no team", async () => {
    vi.mocked(checkInviteCode).mockResolvedValue({
      valid: false,
      teamName: null,
    });
    const user = userEvent.setup();
    renderInvite();

    await fillNewLogin(user, "YANLIS99");
    await user.click(screen.getByRole("button", { name: "Ekibe katıl" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Bu kodla bir takım bulunamadı.",
    );
    expect(checkInviteCode).toHaveBeenCalledWith("YANLIS99");
    expect(createFirebaseAccount).not.toHaveBeenCalled();
    expect(registerMember).not.toHaveBeenCalled();
    expect(readInviteIntent()).toBeNull();
    expect(screen.getByRole("button", { name: "Ekibe katıl" })).toBeEnabled();
  });

  it("goes ahead when the check cannot answer, since registration checks again", async () => {
    vi.mocked(checkInviteCode).mockRejectedValue(
      new ClientApiError("Çok fazla deneme.", 429),
    );
    const user = userEvent.setup();
    renderInvite();

    await fillNewLogin(user, "ABCD1234");
    await user.click(screen.getByRole("button", { name: "Ekibe katıl" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
    expect(createFirebaseAccount).toHaveBeenCalled();
  });

  it("fills the code from a shared link and names the team", async () => {
    searchParams = new URLSearchParams({ code: "LINK2345" });
    renderInvite();

    expect(field("invite-code")).toHaveValue("LINK2345");
    expect(
      await screen.findByText("Yıldız Team takımına katılıyorsun."),
    ).toBeInTheDocument();
    expect(checkInviteCode).toHaveBeenCalledWith("LINK2345");
  });

  it("says at once when a shared link's code is no longer valid", async () => {
    vi.mocked(checkInviteCode).mockResolvedValue({
      valid: false,
      teamName: null,
    });
    searchParams = new URLSearchParams({ code: "ESKI2345" });
    renderInvite();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Bu kodla bir takım bulunamadı.",
    );
  });

  it("brings back the code saved before the person left to verify their e-mail", () => {
    saveInviteIntent("SAKL2345");
    renderInvite();

    expect(field("invite-code")).toHaveValue("SAKL2345");
    expect(checkInviteCode).not.toHaveBeenCalled();
  });

  it("remembers the code before making the login, and forgets it once joined", async () => {
    vi.mocked(createFirebaseAccount).mockImplementation(async () => {
      expect(readInviteIntent()?.code).toBe("ABCD1234");
      return "id-token";
    });
    const user = userEvent.setup();
    renderInvite();

    await fillNewLogin(user, "ABCD1234");
    await user.click(screen.getByRole("button", { name: "Ekibe katıl" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
    expect(readInviteIntent()).toBeNull();
  });

  // The login they made here earlier, back after verifying elsewhere: no second login, no "email already in use".
  it("joins with a signed-in e-mail login on return, verifying it first when needed", async () => {
    searchParams = new URLSearchParams({ code: "ABCD1234", resume: "1" });
    vi.mocked(currentSignedInAccount).mockResolvedValue({
      email: "deniz@ornek.com",
      fullName: "",
      verified: false,
      otg: false,
    });
    const user = userEvent.setup();
    renderInvite();

    expect(
      screen.getByText(/Kaldığın yerden devam ediyorsun/),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Bu hesapla katılıyorsun:", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText("deniz@ornek.com")).toBeInTheDocument();
    expect(field("invite-password")).toBeNull();

    await user.type(field("invite-first-name")!, "Deniz");
    await user.type(field("invite-last-name")!, "Kaya");
    await user.type(field("invite-phone")!, "+905551112233");
    await user.click(screen.getByRole("button", { name: "Ekibe katıl" }));

    expect(
      await screen.findByText("verify deniz@ornek.com"),
    ).toBeInTheDocument();
    expect(createFirebaseAccount).not.toHaveBeenCalled();
    expect(registerMember).not.toHaveBeenCalled();
  });

  it("registers a verified signed-in e-mail login straight away", async () => {
    vi.mocked(currentSignedInAccount).mockResolvedValue({
      email: "deniz@ornek.com",
      fullName: "Deniz Kaya",
      verified: true,
      otg: false,
    });
    const user = userEvent.setup();
    renderInvite();

    await screen.findByText("deniz@ornek.com");
    await user.type(field("invite-code")!, "ABCD1234");
    await user.type(field("invite-phone")!, "+905551112233");
    await user.click(screen.getByRole("button", { name: "Ekibe katıl" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
    expect(createFirebaseAccount).not.toHaveBeenCalled();
    expect(registerMember).toHaveBeenCalledWith(
      {
        fullName: "Deniz Kaya",
        email: "deniz@ornek.com",
        inviteCode: "ABCD1234",
        phone: "+905551112233",
      },
      "id-token",
    );
  });

  it("sends someone whose address already has a login to sign in, with the code kept", async () => {
    const taken = new Error("auth/email-already-in-use");
    vi.mocked(createFirebaseAccount).mockRejectedValue(taken);
    vi.mocked(isEmailAlreadyInUse).mockImplementation(
      (error) => error === taken,
    );
    const user = userEvent.setup();
    renderInvite();

    await fillNewLogin(user, "ABCD1234");
    await user.click(screen.getByRole("button", { name: "Ekibe katıl" }));

    expect(
      await screen.findByText(/Bu e-posta adresiyle zaten bir giriş var/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Giriş yap ve devam et" }),
    ).toHaveAttribute("href", "/login");
    expect(readInviteIntent()?.code).toBe("ABCD1234");
    expect(registerMember).not.toHaveBeenCalled();
  });
});

async function fillNewLogin(
  user: ReturnType<typeof userEvent.setup>,
  code: string,
) {
  await user.type(field("invite-code")!, code);
  await user.type(field("invite-first-name")!, "Deniz");
  await user.type(field("invite-last-name")!, "Kaya");
  await user.type(field("invite-email")!, "deniz@ornek.com");
  await user.type(field("invite-phone")!, "+905551112233");
  await user.type(field("invite-password")!, "Guclu-sifre-123");
  await user.type(field("invite-password-confirm")!, "Guclu-sifre-123");
}
