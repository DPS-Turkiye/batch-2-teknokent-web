import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OtgCallbackView } from "@/components/login/otg-callback-view";
import { ClientApiError } from "@/lib/client/api";
import { completeInstitutionLogin } from "@/lib/client/institution-login";
import { fetchOnboardingDraft } from "@/lib/client/onboarding-draft";
import { ACCOUNT_NOT_APPROVED, REGISTRATION_REQUIRED } from "@/lib/const";
import {
  signInWithInstitutionToken,
  signOutOfFirebase,
} from "@/lib/firebase/auth";
import { InLocale } from "@test/test-utils";

const replace = vi.fn();
const login = vi.fn();
let searchParams = new URLSearchParams("code=code-1&state=s-1");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));
vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ login }),
}));
vi.mock("@/lib/client/institution-login", () => ({
  completeInstitutionLogin: vi.fn(),
}));
vi.mock("@/lib/client/onboarding-draft", () => ({
  fetchOnboardingDraft: vi.fn(),
}));
vi.mock("@/lib/firebase/auth", () => ({
  signInWithInstitutionToken: vi.fn(),
  signOutOfFirebase: vi.fn(),
  describeAuthError: (error: unknown) =>
    error instanceof Error ? error.message : "Kimlik doğrulama tamamlanamadı.",
}));

function renderCallback() {
  return render(
    <InLocale locale="tr">
      <OtgCallbackView />
    </InLocale>,
  );
}

describe("OTG callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams("code=code-1&state=s-1");
    vi.mocked(completeInstitutionLogin).mockResolvedValue({
      customToken: "custom-1",
      next: null,
    });
    vi.mocked(signInWithInstitutionToken).mockResolvedValue("id-token-1");
    vi.mocked(fetchOnboardingDraft).mockResolvedValue(null);
    vi.mocked(signOutOfFirebase).mockResolvedValue();
    login.mockResolvedValue({});
  });

  it("trades the code once and opens the session", async () => {
    renderCallback();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/workspace"));
    expect(completeInstitutionLogin).toHaveBeenCalledTimes(1);
    expect(completeInstitutionLogin).toHaveBeenCalledWith("otg", "s-1", {
      code: "code-1",
    });
    expect(signInWithInstitutionToken).toHaveBeenCalledWith("custom-1");
    expect(login).toHaveBeenCalledWith("id-token-1");
  });

  it("lands on the in-app page the login was started for", async () => {
    vi.mocked(completeInstitutionLogin).mockResolvedValue({
      customToken: "custom-1",
      next: "/programs/42",
    });
    renderCallback();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/programs/42"));
  });

  // Onboarding and invites stay Menton's: a newcomer goes through the ordinary signup, already signed in.
  it("sends someone without a Menton account to the ordinary signup", async () => {
    login.mockRejectedValue(
      new ClientApiError("Kayıt gerekli", 401, REGISTRATION_REQUIRED),
    );
    renderCallback();

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/signup?resume=1"),
    );
    expect(fetchOnboardingDraft).toHaveBeenCalledWith("id-token-1");
  });

  it("sends a pending account to its status page", async () => {
    login.mockRejectedValue(
      new ClientApiError("Onay bekleniyor", 403, ACCOUNT_NOT_APPROVED),
    );
    renderCallback();

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/application-status"),
    );
  });

  it("says so politely when the student cancelled on OTG, without calling the backend", async () => {
    searchParams = new URLSearchParams("error=access_denied&state=s-1");
    renderCallback();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Girişi iptal ettin.",
    );
    expect(
      screen.getByRole("link", { name: "Giriş sayfasına dön" }),
    ).toHaveAttribute("href", "/login");
    expect(completeInstitutionLogin).not.toHaveBeenCalled();
  });

  it("shows the refusal when the login cannot be finished", async () => {
    vi.mocked(completeInstitutionLogin).mockRejectedValue(
      new Error("Giriş bağlantısının süresi doldu."),
    );
    renderCallback();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Giriş bağlantısının süresi doldu.",
    );
    expect(login).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(signOutOfFirebase).not.toHaveBeenCalled();
  });

  // A refused account must not stay signed in to Firebase, or /signup would continue as it.
  it("signs out of Firebase when the session is refused", async () => {
    login.mockRejectedValue(
      new ClientApiError(
        "Bu hesap için menton erişimi bulunamadı.",
        403,
        "FORBIDDEN",
      ),
    );
    renderCallback();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Bu hesap için menton erişimi bulunamadı.",
    );
    expect(signOutOfFirebase).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });

  it("signs out of Firebase when the custom token cannot be used", async () => {
    vi.mocked(signInWithInstitutionToken).mockRejectedValue(
      new Error("Kimlik doğrulama tamamlanamadı."),
    );
    renderCallback();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(signOutOfFirebase).toHaveBeenCalledTimes(1);
    expect(login).not.toHaveBeenCalled();
  });

  it("refuses a callback without a code", async () => {
    searchParams = new URLSearchParams("state=s-1");
    renderCallback();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ODTÜ TEKNOKENT Girişimcilik ile giriş tamamlanamadı.",
    );
    expect(completeInstitutionLogin).not.toHaveBeenCalled();
  });
});
