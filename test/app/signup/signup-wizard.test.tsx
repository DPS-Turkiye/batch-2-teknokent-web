import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SignupWizardView } from "@/components/signup/signup-wizard";
import { SIGNUP_STEP_CTA, SignupStep } from "@/interfaces/signup";

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
    render(<SignupWizardView />);

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
    render(<SignupWizardView />);

    const next = screen.getByRole("button", { name: CTA.personal });
    expect(next).toBeDisabled();

    await completePersonalStep(user);
    expect(next).toBeEnabled();
  });

  it("disables Geri on the first step", () => {
    render(<SignupWizardView />);

    expect(screen.getByRole("button", { name: "Geri" })).toBeDisabled();
  });

  it("counts the bio characters as the mentee types", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView />);

    expect(screen.getByText("0/280")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Kısa tanıtım"), "Merhaba");
    expect(screen.getByText("7/280")).toBeInTheDocument();
  });

  it("selects and deselects an expertise chip", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView />);

    const chip = screen.getByRole("button", { name: "Figma" });
    expect(chip).toHaveAttribute("aria-pressed", "false");

    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");

    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
  });

  it("walks through every step and reaches the review summary", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView />);

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

  it("returns to the matching step when a review section is edited", async () => {
    const user = userEvent.setup();
    render(<SignupWizardView />);

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
    render(<SignupWizardView />);

    await completePersonalStep(user);
    await user.click(screen.getByRole("button", { name: CTA.personal }));
    await fillStartupStep(user);
    await user.click(screen.getByRole("button", { name: CTA.startup }));
    await user.click(screen.getByRole("button", { name: CTA.documents }));

    await user.click(screen.getByRole("button", { name: CTA.review }));

    expect(screen.getByText("Koordinatör incelemesinde")).toBeInTheDocument();
    expect(screen.getByText("Profil tamamlandı")).toBeInTheDocument();
    expect(screen.getByText("Startup aktif olacak")).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Profil kurulum adımları" }),
    ).not.toBeInTheDocument();
  });
});
