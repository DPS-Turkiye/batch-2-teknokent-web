import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MentorOnboardingFlow } from "@/components/mentor-onboarding/mentor-onboarding-flow";
import { SignupFlow } from "@/components/signup/signup-flow";
import { registerMentor } from "@/lib/client/auth";
import { updateMentorProfile } from "@/lib/client/mentor-profile";
import { renderWithQueryClient as render } from "@test/test-utils";

const searchParams = { get: vi.fn() };

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/firebase/auth", () => ({
  createFirebaseAccount: vi.fn().mockResolvedValue("id-token"),
  currentIdToken: vi.fn().mockResolvedValue("id-token"),
  isCurrentEmailVerified: () => true,
  describeAuthError: () => "Kimlik doğrulama tamamlanamadı.",
}));

vi.mock("@/lib/client/onboarding-draft", () => ({
  fetchOnboardingDraft: vi.fn().mockResolvedValue(null),
  saveOnboardingDraft: vi.fn().mockResolvedValue({}),
  clearOnboardingDraft: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/client/auth", () => ({
  registerMentor: vi.fn().mockResolvedValue({}),
  registerFounder: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/client/mentor-profile", () => ({
  updateMentorProfile: vi.fn().mockResolvedValue({}),
}));

async function fillRequiredIntro(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: "Bilgilerimi manuel gireceğim" }),
  );
  await user.type(screen.getByLabelText(/Mevcut unvan/), "Ürün Direktörü");
  await user.type(screen.getByLabelText(/Şirket/), "Peak");
  await user.type(screen.getByLabelText(/Toplam deneyim/), "9 yıl");
}

async function fillAccount(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Ad/), "Nihan");
  await user.type(screen.getByLabelText(/Soyad/), "Öztürk");
  await user.type(screen.getByLabelText(/E-posta/), "nihan@peak.co");
  await user.type(screen.getByLabelText(/Telefon/), "+905551112233");
  await user.type(screen.getByLabelText("Şifre *"), "Sifre1234!");
  await user.type(screen.getByLabelText(/Şifre tekrar/), "Sifre1234!");
}

describe("Signup role routing", () => {
  it("sends a mentee to the startup profile flow", async () => {
    searchParams.get.mockReturnValue(null);
    const user = userEvent.setup();
    render(<SignupFlow />);

    expect(
      screen.getByRole("heading", { name: "Startup'ınla METUal'a katıl" }),
    ).toBeInTheDocument();

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
    searchParams.get.mockReturnValue("mentor");
    const user = userEvent.setup();
    render(<SignupFlow />);

    expect(
      screen.getByRole("heading", { name: "Mentor olarak METUal'a katıl" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("CV'nden mentor profilini oluştur"),
    ).toBeInTheDocument();

    await fillAccount(user);
    await user.click(
      screen.getByRole("button", { name: "Hesap oluştur ve devam et" }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Sizi tanıyalım" }),
      ).toBeInTheDocument(),
    );
    expect(vi.mocked(registerMentor)).toHaveBeenCalledWith(
      {
        fullName: "Nihan Öztürk",
        email: "nihan@peak.co",
        phone: "+905551112233",
      },
      "id-token",
    );
  });
});

describe("Mentor onboarding flow", () => {
  it("lists the four setup steps", () => {
    render(<MentorOnboardingFlow />);

    const stepper = screen.getByRole("navigation", {
      name: "Mentor profil kurulum adımları",
    });
    [
      "Sizi tanıyalım",
      "Uzmanlıklarınız",
      "Mentorluk uyumu",
      "Tercihleriniz",
    ].forEach((label) =>
      expect(within(stepper).getByText(label)).toBeInTheDocument(),
    );
  });

  it("blocks Devam et until the CV step resolves", async () => {
    const user = userEvent.setup();
    render(<MentorOnboardingFlow />);

    expect(screen.getByRole("button", { name: "Devam et" })).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Bilgilerimi manuel gireceğim" }),
    );

    expect(
      screen.getByRole("heading", { name: "Bilgilerinizi kontrol edin" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Devam et" })).toBeDisabled();
    expect(
      screen.getAllByText("Bu alanı doldurman zorunlu.").length,
    ).toBeGreaterThan(0);

    await user.type(screen.getByLabelText(/Mevcut unvan/), "Ürün Direktörü");
    await user.type(screen.getByLabelText(/Şirket/), "Peak");
    await user.type(screen.getByLabelText(/Toplam deneyim/), "9 yıl");
    expect(screen.getByRole("button", { name: "Devam et" })).toBeEnabled();
  });

  it("enforces the six-area expertise cap in the UI", async () => {
    const user = userEvent.setup();
    render(<MentorOnboardingFlow />);

    await fillRequiredIntro(user);
    await user.click(screen.getByRole("button", { name: "Devam et" }));

    for (const area of [
      "Finans",
      "Yatırım Alma",
      "Finansal Modelleme",
      "Strateji",
      "Birim Ekonomisi",
      "Fiyatlandırma",
    ]) {
      await user.click(screen.getByRole("button", { name: area }));
    }

    expect(screen.getByText(/Sınıra ulaştınız/)).toBeInTheDocument();

    const seventh = screen.getByRole("button", { name: "Nakit Akışı" });
    await user.click(seventh);
    expect(seventh).toHaveAttribute("aria-pressed", "false");
  });

  it("walks the whole flow through to the finished profile", async () => {
    const user = userEvent.setup();
    render(<MentorOnboardingFlow />);

    await fillRequiredIntro(user);
    await user.click(screen.getByRole("button", { name: "Devam et" }));

    await user.click(screen.getByRole("button", { name: "Finans" }));
    await user.click(screen.getByRole("button", { name: "Devam et" }));

    expect(
      screen.getByRole("heading", {
        name: "Hangi konularda en çok katkı sağlayabilirsiniz?",
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Yatırıma hazırlık" }));
    await user.click(screen.getByRole("button", { name: /Build/ }));
    await user.click(screen.getByRole("button", { name: "Devam et" }));

    expect(
      screen.getByRole("heading", {
        name: "Mentorluk tercihlerinizi belirleyin",
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Problem çözme" }));
    await user.click(screen.getByRole("button", { name: "MVP" }));
    await user.click(screen.getByRole("button", { name: "SaaS" }));
    await user.click(screen.getByRole("button", { name: "Profili tamamla" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: "Başvurunuz onay için gönderildi",
        }),
      ).toBeInTheDocument(),
    );
    expect(updateMentorProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        specialties: expect.arrayContaining(["Finans"]),
        mentoringStyle: "Problem çözme",
      }),
      "id-token",
    );
    expect(screen.getByText("Finans")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Başvuru durumunu görüntüle" }),
    ).toHaveAttribute("href", "/application-status");
    expect(
      screen.queryByRole("link", { name: "Mentor paneline geç" }),
    ).not.toBeInTheDocument();
  });

  it("lets the mentor step back to a previous step", async () => {
    const user = userEvent.setup();
    render(<MentorOnboardingFlow />);

    expect(screen.getByRole("button", { name: "Geri" })).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Bilgilerimi manuel gireceğim" }),
    );
    await user.type(screen.getByLabelText(/Mevcut unvan/), "Ürün Direktörü");
    await user.type(screen.getByLabelText(/Şirket/), "Peak");
    await user.type(screen.getByLabelText(/Toplam deneyim/), "9 yıl");
    await user.click(screen.getByRole("button", { name: "Devam et" }));
    expect(screen.getByRole("button", { name: "Geri" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Geri" }));
    expect(
      screen.getByRole("heading", { name: "Bilgilerinizi kontrol edin" }),
    ).toBeInTheDocument();
  });
});
