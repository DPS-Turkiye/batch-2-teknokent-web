import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupProfileSection } from "@/components/profile/startup-profile-section";
import {
  StartupFundingStage,
  type StartupProfile,
} from "@/interfaces/organization";
import {
  getStartupProfile,
  saveStartupProfile,
} from "@/lib/client/organization";
import { startupProfile } from "@test/fixtures/startup-profile";
import { renderWithQueryClient as render } from "@test/test-utils";

vi.mock("@/lib/client/organization", () => ({
  getStartupProfile: vi.fn(),
  saveStartupProfile: vi.fn(),
}));

function profile(overrides: Partial<StartupProfile> = {}): StartupProfile {
  return startupProfile({
    description: "Gönüllülük platformu",
    website: "dongu.co",
    problem: "Gönüllüler bulunamıyor",
    sector: "SaaS",
    maturity: "MVP",
    supportAreas: ["Finans"],
    updatedAt: "2026-09-03T09:00:00Z",
    ...overrides,
  });
}

describe("StartupProfileSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStartupProfile).mockResolvedValue(profile());
  });

  it("shows what the founder typed at signup", async () => {
    render(<StartupProfileSection />);

    expect(await screen.findByText("Döngü")).toBeInTheDocument();
    expect(screen.getByText("dongu.co")).toBeInTheDocument();
    expect(screen.getByText("Gönüllüler bulunamıyor")).toBeInTheDocument();
    expect(screen.getByText("SaaS")).toBeInTheDocument();
    expect(screen.getByText("Finans")).toBeInTheDocument();
  });

  // Saving an unchanged form is a wasted write, and the button should say so.
  it("keeps save disabled until something changes", async () => {
    const user = userEvent.setup();
    render(<StartupProfileSection />);

    const save = await screen.findByRole("button", {
      name: "Değişiklikleri kaydet",
    });
    expect(save).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Sektör alanını düzenle" }),
    );
    await user.type(screen.getByLabelText("Sektör"), "X");
    expect(save).toBeEnabled();
  });

  it("marks the startup name as required and shows its field error", async () => {
    const user = userEvent.setup();
    render(<StartupProfileSection />);

    const label = await screen.findByText("Startup adı", { selector: "label" });
    expect(label).toHaveTextContent("Startup adı *");
    await user.click(
      screen.getByRole("button", { name: "Startup adı alanını düzenle" }),
    );
    await user.clear(screen.getByRole("textbox", { name: "Startup adı*" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Startup adı zorunludur.",
    );
    expect(
      screen.getByRole("button", { name: "Değişiklikleri kaydet" }),
    ).toBeDisabled();
  });

  it("saves the edited profile and confirms it", async () => {
    vi.mocked(saveStartupProfile).mockResolvedValue(
      profile({ sector: "HealthTech" }),
    );
    const user = userEvent.setup();
    render(<StartupProfileSection />);

    await user.click(
      await screen.findByRole("button", { name: "Sektör alanını düzenle" }),
    );
    const sector = screen.getByLabelText("Sektör");
    await user.clear(sector);
    await user.type(sector, "HealthTech");
    await user.click(
      screen.getByRole("button", { name: "Değişiklikleri kaydet" }),
    );

    await waitFor(() =>
      expect(vi.mocked(saveStartupProfile)).toHaveBeenCalledWith(
        expect.objectContaining({ sector: "HealthTech", name: "Döngü" }),
      ),
    );
    expect(await screen.findByText("Kaydedildi")).toBeInTheDocument();
  });

  it("reports a failed save instead of looking saved", async () => {
    vi.mocked(saveStartupProfile).mockRejectedValue(
      new Error("Startup profile could not be saved."),
    );
    const user = userEvent.setup();
    render(<StartupProfileSection />);

    await user.click(
      await screen.findByRole("button", { name: "Sektör alanını düzenle" }),
    );
    await user.type(screen.getByLabelText("Sektör"), "X");
    await user.click(
      screen.getByRole("button", { name: "Değişiklikleri kaydet" }),
    );

    expect(
      await screen.findByText("Startup profile could not be saved."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Kaydedildi")).not.toBeInTheDocument();
  });

  it("saves a founding year and a funding stage", async () => {
    vi.mocked(saveStartupProfile).mockResolvedValue(
      profile({ foundedYear: 2025, fundingStage: StartupFundingStage.Seed }),
    );
    const user = userEvent.setup();
    render(<StartupProfileSection />);

    await user.click(
      await screen.findByRole("button", {
        name: "Kuruluş yılı alanını düzenle",
      }),
    );
    await user.type(screen.getByLabelText("Kuruluş yılı"), "2025");
    await user.selectOptions(screen.getByLabelText("Yatırım aşaması"), "Seed");
    await user.click(
      screen.getByRole("button", { name: "Değişiklikleri kaydet" }),
    );

    await waitFor(() =>
      expect(vi.mocked(saveStartupProfile)).toHaveBeenCalledWith(
        expect.objectContaining({
          foundedYear: 2025,
          fundingStage: StartupFundingStage.Seed,
        }),
      ),
    );
  });
});
