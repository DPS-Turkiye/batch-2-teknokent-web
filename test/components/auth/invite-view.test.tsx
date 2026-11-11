import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InviteView } from "@/components/auth/invite-view";
import { ClientApiError } from "@/lib/client/api";
import { registerMember } from "@/lib/client/auth";
import {
  createFirebaseAccount,
  currentIdToken,
  currentOtgAccount,
  isCurrentEmailVerified,
  signOutOfFirebase,
} from "@/lib/firebase/auth";
import { InLocale } from "@test/test-utils";

const push = vi.fn();
const login = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
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
vi.mock("@/lib/firebase/auth", () => ({
  createFirebaseAccount: vi.fn(),
  currentIdToken: vi.fn(),
  currentOtgAccount: vi.fn(),
  isCurrentEmailVerified: vi.fn(),
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
    vi.mocked(currentOtgAccount).mockResolvedValue(null);
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
    vi.mocked(currentOtgAccount).mockResolvedValue({
      email: "ogrenci@ornek.com",
      fullName: "Ayşe Nur Yılmaz",
      verified: true,
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
    vi.mocked(currentOtgAccount).mockResolvedValue({
      email: "ogrenci@ornek.com",
      fullName: "",
      verified: true,
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
    vi.mocked(currentOtgAccount).mockResolvedValue({
      email: "ogrenci@ornek.com",
      fullName: "Ayşe Yılmaz",
      verified: false,
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
    }) => void = () => undefined;
    vi.mocked(currentOtgAccount).mockReturnValue(
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
    });

    expect(await screen.findByText("ogrenci@ornek.com")).toBeInTheDocument();
    expect(field("invite-first-name")).toHaveValue("Deniz");
    expect(field("invite-last-name")).toHaveValue("Yılmaz");
  });

  it("needs a last name when the OTG name is a single word", async () => {
    vi.mocked(currentOtgAccount).mockResolvedValue({
      email: "ogrenci@ornek.com",
      fullName: "Ayşe",
      verified: true,
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
    vi.mocked(currentOtgAccount).mockResolvedValue({
      email: "ogrenci@ornek.com",
      fullName: "Ayşe Yılmaz",
      verified: true,
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
    vi.mocked(currentOtgAccount).mockResolvedValue({
      email: "ogrenci@ornek.com",
      fullName: "",
      verified: true,
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
});
