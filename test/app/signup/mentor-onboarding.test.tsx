import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MentorOnboardingFlow } from "@/components/mentor-onboarding/mentor-onboarding-flow";
import { SignupFlow } from "@/components/signup/signup-flow";

const searchParams = { get: vi.fn() };

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

async function fillAccount(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Ad/), "Nihan");
  await user.type(screen.getByLabelText(/Soyad/), "Öztürk");
  await user.type(screen.getByLabelText(/E-posta/), "nihan@peak.co");
  await user.type(screen.getByLabelText(/Telefon/), "+905551112233");
  await user.type(screen.getByLabelText("Şifre *"), "sifre1234");
  await user.type(screen.getByLabelText(/Şifre tekrar/), "sifre1234");
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

    expect(
      screen.getByRole("heading", { name: "Kişisel profilini oluştur" }),
    ).toBeInTheDocument();
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

    expect(
      screen.getByRole("heading", { name: "Sizi tanıyalım" }),
    ).toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: "Devam et" })).toBeEnabled();
  });

  it("enforces the six-area expertise cap in the UI", async () => {
    const user = userEvent.setup();
    render(<MentorOnboardingFlow />);

    await user.click(
      screen.getByRole("button", { name: "Bilgilerimi manuel gireceğim" }),
    );
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

    await user.click(
      screen.getByRole("button", { name: "Bilgilerimi manuel gireceğim" }),
    );
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
    await user.click(screen.getByRole("button", { name: "Profili tamamla" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Mentor profiliniz hazır" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Finans")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Mentor paneline geç" }),
    ).toHaveAttribute("href", "/mentor-dashboard");
    expect(
      screen.getByRole("link", { name: "Profilimi görüntüle" }),
    ).toHaveAttribute("href", "/mentor-profile");
  });

  it("lets the mentor step back to a previous step", async () => {
    const user = userEvent.setup();
    render(<MentorOnboardingFlow />);

    expect(screen.getByRole("button", { name: "Geri" })).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Bilgilerimi manuel gireceğim" }),
    );
    await user.click(screen.getByRole("button", { name: "Devam et" }));
    expect(screen.getByRole("button", { name: "Geri" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Geri" }));
    expect(
      screen.getByRole("heading", { name: "Bilgilerinizi kontrol edin" }),
    ).toBeInTheDocument();
  });
});
