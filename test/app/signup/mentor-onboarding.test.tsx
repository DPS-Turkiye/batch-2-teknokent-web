import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorOnboardingFlow } from "@/components/mentor-onboarding/mentor-onboarding-flow";
import { SignupFlow } from "@/components/signup/signup-flow";
import { ClientApiError } from "@/lib/client/api";
import { fetchAccountStatus } from "@/lib/client/auth";
import {
  updateAvailabilitySettings,
  updateMentorProfile,
} from "@/lib/client/mentor-profile";
import { renderWithQueryClient as render } from "@test/test-utils";

const searchParams = new URLSearchParams();
const logout = vi.fn().mockResolvedValue(undefined);
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ logout }),
}));

vi.mock("@/lib/firebase/auth", () => ({
  createFirebaseAccount: vi.fn().mockResolvedValue("id-token"),
  currentFirebaseAccount: vi.fn().mockResolvedValue(null),
  currentIdToken: vi.fn().mockResolvedValue("id-token"),
  isCurrentEmailVerified: () => true,
  describeAuthError: (error: unknown) =>
    error instanceof Error ? error.message : "Kimlik doğrulama tamamlanamadı.",
}));

vi.mock("@/lib/client/onboarding-draft", () => ({
  fetchOnboardingDraft: vi.fn().mockResolvedValue(null),
  saveOnboardingDraft: vi.fn().mockResolvedValue({}),
  clearOnboardingDraft: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/client/auth", () => ({
  fetchAccountStatus: vi.fn(),
  registerMentor: vi.fn().mockResolvedValue({}),
  registerFounder: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/client/mentor-profile", () => ({
  updateMentorProfile: vi.fn().mockResolvedValue({}),
  updateAvailabilitySettings: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/client/user-profile", () => ({
  getUserProfile: vi.fn().mockResolvedValue({
    id: "u1",
    fullName: "Nihan Öztürk",
    email: "nihan@peak.co",
    jobTitle: null,
    phone: null,
    bio: null,
    linkedinUrl: null,
    expertise: [],
  }),
  saveUserProfile: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/client/documents", () => ({
  uploadDocument: vi.fn(),
  listDocuments: vi.fn().mockResolvedValue([]),
}));

type User = ReturnType<typeof userEvent.setup>;

async function fillAccount(user: User) {
  await user.type(screen.getByLabelText(/^Ad/), "Nihan");
  await user.type(screen.getByLabelText(/Soyad/), "Öztürk");
  await user.type(screen.getByLabelText(/E-posta/), "nihan@peak.co");
  await user.type(screen.getByLabelText(/Telefon/), "+905551112233");
  await user.type(screen.getByLabelText("Şifre *"), "Sifre1234!");
  await user.type(screen.getByLabelText(/Şifre tekrar/), "Sifre1234!");
}

async function fillProfileStep(user: User) {
  await user.click(
    screen.getByRole("button", { name: "Bilgilerimi manuel gireceğim" }),
  );
  await user.type(screen.getByLabelText(/Unvanın/), "Ürün Direktörü");
  await user.type(screen.getByLabelText(/Deneyim/), "9 yıl");
}

beforeEach(() => {
  vi.clearAllMocks();
  searchParams.delete("role");
  searchParams.delete("resume");
});

describe("Signup role routing", () => {
  it("sends a founder from the role page through the account form to the startup wizard", async () => {
    const user = userEvent.setup();
    render(<SignupFlow />);

    await user.click(
      screen.getByRole("button", { name: "Girişimci olarak devam et" }),
    );
    await fillAccount(user);
    await user.click(
      screen.getByRole("button", { name: "Hesap oluştur ve devam et" }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Kişisel profilini oluştur" }),
      ).toBeInTheDocument(),
    );
  });

  it("sends a mentor to the mentor onboarding flow", async () => {
    searchParams.set("role", "mentor");
    vi.mocked(fetchAccountStatus).mockRejectedValue(
      new ClientApiError("Registration required", 401),
    );
    const user = userEvent.setup();
    render(<SignupFlow />);

    await fillAccount(user);
    await user.click(
      screen.getByRole("button", { name: "Hesap oluştur ve devam et" }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Uzmanlık profilini oluştur" }),
      ).toBeInTheDocument(),
    );
    // The name typed on the account form carries into the mentor form.
    await user.click(
      screen.getByRole("button", { name: "Bilgilerimi manuel gireceğim" }),
    );
    expect(screen.getByLabelText(/^Ad/)).toHaveValue("Nihan");
    expect(screen.getByLabelText(/Soyad/)).toHaveValue("Öztürk");
  });
});

describe("Mentor onboarding flow", () => {
  it("lists the four steps in the rail", () => {
    render(<MentorOnboardingFlow fullName="Nihan Öztürk" />);

    for (const title of [
      "Uzmanlık profilin",
      "Mentorluk alanların",
      "Müsaitlik ve kapasite",
      "Gözden geçir ve gönder",
    ]) {
      expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    }
  });

  it("keeps Devam et shut until the profile form has its required fields", async () => {
    const user = userEvent.setup();
    render(<MentorOnboardingFlow fullName="Nihan Öztürk" />);

    expect(screen.getByRole("button", { name: "Devam et" })).toBeDisabled();
    await fillProfileStep(user);
    expect(screen.getByRole("button", { name: "Devam et" })).toBeEnabled();
  });

  it("walks all four steps and sends the profile to the coordinator", async () => {
    const user = userEvent.setup();
    render(<MentorOnboardingFlow fullName="Nihan Öztürk" />);

    await fillProfileStep(user);
    await user.click(screen.getByRole("button", { name: "Devam et" }));

    expect(
      screen.getByRole("heading", {
        name: "Hangi konularda mentorluk vereceksin?",
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Finans" }));
    await user.click(screen.getByRole("button", { name: "MVP" }));
    await user.click(screen.getByRole("button", { name: "Devam et" }));

    expect(
      screen.getByRole("heading", {
        name: "Müsaitliğini ve kapasiteni belirle",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Devam et" })).toBeDisabled();
    await user.click(screen.getByRole("switch", { name: "Salı uygun" }));
    await user.click(screen.getByRole("button", { name: "Devam et" }));

    expect(
      screen.getByRole("heading", { name: "Gözden geçir ve gönder" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ürün Direktörü")).toBeInTheDocument();
    const send = screen.getByRole("button", { name: "Koordinatöre gönder" });
    expect(send).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    await user.click(send);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: "Mentor profilin koordinatöre gönderildi",
        }),
      ).toBeInTheDocument(),
    );
    expect(updateMentorProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        professionalTitle: "Ürün Direktörü",
        specialties: ["Finans"],
        startupStages: "MVP",
      }),
      "id-token",
    );
    expect(updateAvailabilitySettings).toHaveBeenCalled();
    expect(
      screen.getByRole("link", { name: "Gönderilen profili görüntüle" }),
    ).toHaveAttribute("href", "/application-status");
  });

  it("goes back from the form to the CV upload, then disables Geri on the first screen", async () => {
    const user = userEvent.setup();
    render(<MentorOnboardingFlow fullName="Nihan Öztürk" />);

    expect(screen.getByRole("button", { name: "← Geri" })).toBeDisabled();
    await fillProfileStep(user);
    await user.click(screen.getByRole("button", { name: "Devam et" }));
    await user.click(screen.getByRole("button", { name: "← Geri" }));

    expect(screen.getByLabelText(/Unvanın/)).toHaveValue("Ürün Direktörü");
    await user.click(screen.getByRole("button", { name: "← Geri" }));
    expect(
      screen.getByRole("button", { name: "Bilgilerimi manuel gireceğim" }),
    ).toBeInTheDocument();
  });

  it("saves the draft and signs out from Kaydet ve çık", async () => {
    const user = userEvent.setup();
    render(<MentorOnboardingFlow fullName="Nihan Öztürk" />);

    await user.click(screen.getByRole("button", { name: "Kaydet ve çık" }));

    await waitFor(() => expect(logout).toHaveBeenCalled());
    expect(push).toHaveBeenCalledWith("/");
  });
});
