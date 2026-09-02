import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SignupWizardView } from "@/components/signup/signup-wizard";
import type { RegisteredAccount } from "@/interfaces/auth";
import { SIGNUP_STEP_CTA, SignupStep } from "@/interfaces/signup";
import { registerFounder } from "@/lib/client/auth";
import { getProgramNames } from "@/lib/client/programs";
import { renderWithQueryClient as render } from "@test/test-utils";

vi.mock("@/lib/firebase/auth", () => ({
  currentIdToken: vi.fn().mockResolvedValue("id-token"),
}));

vi.mock("@/lib/client/auth", () => ({
  registerFounder: vi.fn().mockResolvedValue({}),
}));

// The program picker now loads real programs; the wizard's own assertions are
// not about that list, so it stays empty here.
vi.mock("@/lib/client/programs", () => ({
  getProgramNames: vi.fn().mockResolvedValue([]),
}));

const ACCOUNT: RegisteredAccount = {
  fullName: "Gülse Buran",
  email: "gulse@dongu.co",
  phone: "+905551112233",
};

const CTA = {
  personal: SIGNUP_STEP_CTA[SignupStep.PersonalProfile],
  startup: SIGNUP_STEP_CTA[SignupStep.StartupProfile],
  documents: SIGNUP_STEP_CTA[SignupStep.Documents],
  review: SIGNUP_STEP_CTA[SignupStep.Review],
};

async function fillStartupStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Startup adı/), "Döngü");
  await user.type(screen.getByLabelText(/Tek satırlık tanım/), "Kısa tanım");
  await user.type(
    screen.getByLabelText(/Web sitesi \/ sosyal link/),
    "https://dongu.example",
  );
}

async function completePersonalStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Ad"), "Gülse");
  await user.type(screen.getByLabelText("Soyad"), "Buran");
  await user.type(screen.getByLabelText("Startup'taki rolün"), "Designer");
}

describe("Signup wizard", () => {
  it("opens on step 1 with the four setup steps listed", () => {
    render(<SignupWizardView account={ACCOUNT} />);

    const stepper = screen.getByRole("navigation", {
      name: "Profil kurulum adımları",
    });
    expect(
      within(stepper).getByText("Kişisel profilini oluştur"),
    ).toBeInTheDocument();
    expect(
      within(stepper).getByText("Start up profilini oluştur"),
    ).toBeInTheDocument();
    expect(within(stepper).getByText("Dosyalarını yükle")).toBeInTheDocument();
    expect(within(stepper).getByText("Onay gönder")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Kişisel profilini oluştur" }),
    ).toBeInTheDocument();
  });

  it("keeps Devam et disabled until the required fields are filled", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    const next = screen.getByRole("button", { name: CTA.personal });
    expect(next).toBeDisabled();

    await completePersonalStep(user);
    expect(next).toBeEnabled();
  });

  it("disables Geri on the first step", () => {
    render(<SignupWizardView account={ACCOUNT} />);

    expect(screen.getByRole("button", { name: "Geri" })).toBeDisabled();
  });

  it("counts the bio characters as the mentee types", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    expect(screen.getByText("0/280")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Kısa tanıtım"), "Merhaba");
    expect(screen.getByText("7/280")).toBeInTheDocument();
  });

  it("selects and deselects an expertise chip", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    const chip = screen.getByRole("button", { name: "Figma" });
    expect(chip).toHaveAttribute("aria-pressed", "false");

    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");

    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
  });

  it("walks through every step and reaches the review summary", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await completePersonalStep(user);
    await user.click(screen.getByRole("button", { name: CTA.personal }));

    expect(
      screen.getByRole("heading", { name: "Startup profilini oluştur" }),
    ).toBeInTheDocument();

    await fillStartupStep(user);
    await user.click(screen.getByRole("button", { name: CTA.startup }));

    expect(
      screen.getByRole("heading", { name: "Dosyalarını Yükle" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: CTA.documents }));

    expect(
      screen.getByRole("heading", { name: "Profilini gözden geçir" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Gülse Buran")).toBeInTheDocument();
    expect(screen.getAllByText("Döngü").length).toBeGreaterThan(0);
  });

  it("offers the coordinator's real programs, not a hardcoded list", async () => {
    vi.mocked(getProgramNames).mockResolvedValue([
      { id: "prog-1", name: "metustarts 2026" },
      { id: "prog-2", name: "Seed 2026" },
    ]);
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await completePersonalStep(user);
    await user.click(screen.getByRole("button", { name: CTA.personal }));

    const picker = await screen.findByRole("button", {
      name: /Bir programa dahil değilim/,
    });
    await user.click(picker);

    expect(
      screen.getByRole("option", { name: /metustarts 2026/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /Seed 2026/ }),
    ).toBeInTheDocument();
  });

  it("sends the chosen program id through registration", async () => {
    vi.mocked(getProgramNames).mockResolvedValue([
      { id: "prog-1", name: "metustarts 2026" },
    ]);
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await completePersonalStep(user);
    await user.click(screen.getByRole("button", { name: CTA.personal }));
    await user.click(
      await screen.findByRole("button", { name: /Bir programa dahil değilim/ }),
    );
    await user.click(screen.getByRole("option", { name: /metustarts 2026/ }));

    await fillStartupStep(user);
    await user.click(screen.getByRole("button", { name: CTA.startup }));
    await user.click(screen.getByRole("button", { name: CTA.documents }));
    await user.click(screen.getByRole("button", { name: CTA.review }));

    await waitFor(() =>
      expect(vi.mocked(registerFounder)).toHaveBeenCalledWith(
        expect.objectContaining({ programId: "prog-1" }),
        expect.anything(),
      ),
    );
  });

  it("no longer asks for Bugünkü durum on the startup step or the summary", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await completePersonalStep(user);
    await user.click(screen.getByRole("button", { name: CTA.personal }));

    expect(
      screen.getByRole("heading", { name: "Startup profilini oluştur" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Bugünkü durum")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Ekip büyüklüğü")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Ürün durumu/)).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Mevcut kullanıcı \/ müşteri kanıtı/),
    ).not.toBeInTheDocument();

    await fillStartupStep(user);
    await user.click(screen.getByRole("button", { name: CTA.startup }));
    await user.click(screen.getByRole("button", { name: CTA.documents }));

    expect(
      screen.getByRole("heading", { name: "Profilini gözden geçir" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Bugünkü durum")).not.toBeInTheDocument();
  });

  it("returns to the matching step when a review section is edited", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await completePersonalStep(user);
    await user.click(screen.getByRole("button", { name: CTA.personal }));
    await fillStartupStep(user);
    await user.click(screen.getByRole("button", { name: CTA.startup }));
    await user.click(screen.getByRole("button", { name: CTA.documents }));

    const personalSection = screen
      .getByText("Kişisel bilgiler")
      .closest("section") as HTMLElement;
    await user.click(
      within(personalSection).getByRole("button", { name: "Düzenle" }),
    );

    expect(
      screen.getByRole("heading", { name: "Kişisel profilini oluştur" }),
    ).toBeInTheDocument();
  });

  it("shows the coordinator review status after submitting", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await completePersonalStep(user);
    await user.click(screen.getByRole("button", { name: CTA.personal }));
    await fillStartupStep(user);
    await user.click(screen.getByRole("button", { name: CTA.startup }));
    await user.click(screen.getByRole("button", { name: CTA.documents }));

    await user.click(screen.getByRole("button", { name: CTA.review }));

    await waitFor(() =>
      expect(screen.getByText("Koordinatör incelemesinde")).toBeInTheDocument(),
    );
    expect(screen.getByText("Profil tamamlandı")).toBeInTheDocument();
    expect(screen.getByText("Startup aktif olacak")).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Profil kurulum adımları" }),
    ).not.toBeInTheDocument();
  });

  it("registers the founder with the startup name collected in the wizard", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView account={ACCOUNT} />);

    await completePersonalStep(user);
    await user.click(screen.getByRole("button", { name: CTA.personal }));
    await fillStartupStep(user);
    await user.click(screen.getByRole("button", { name: CTA.startup }));
    await user.click(screen.getByRole("button", { name: CTA.documents }));
    await user.click(screen.getByRole("button", { name: CTA.review }));

    await waitFor(() =>
      expect(vi.mocked(registerFounder)).toHaveBeenCalledWith(
        {
          fullName: "Gülse Buran",
          email: "gulse@dongu.co",
          phone: "+905551112233",
          organizationName: "Döngü",
          description: "Kısa tanım",
          jobTitle: "Designer",
          // No program chosen is a real answer and is sent, not omitted.
          programId: null,
        },
        "id-token",
      ),
    );
  });
});
