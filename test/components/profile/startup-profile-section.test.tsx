import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupProfileSection } from "@/components/profile/startup-profile-section";
import type { StartupProfile } from "@/interfaces/organization";
import {
  getStartupProfile,
  saveStartupProfile,
} from "@/lib/client/organization";
import { renderWithQueryClient as render } from "@test/test-utils";

vi.mock("@/lib/client/organization", () => ({
  getStartupProfile: vi.fn(),
  saveStartupProfile: vi.fn(),
}));

function profile(overrides: Partial<StartupProfile> = {}): StartupProfile {
  return {
    id: "org-1",
    name: "Döngü",
    description: "Gönüllülük platformu",
    website: "dongu.co",
    problem: "Gönüllüler bulunamıyor",
    solution: null,
    currentSolution: null,
    targetUser: null,
    sector: "SaaS",
    maturity: "MVP",
    programLevel: null,
    supportAreas: ["Finans"],
    createdAt: "2026-09-01T12:00:00Z",
    updatedAt: "2026-09-03T09:00:00Z",
    ...overrides,
  };
}

describe("StartupProfileSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStartupProfile).mockResolvedValue(profile());
  });

  it("shows what the founder typed at signup", async () => {
    render(<StartupProfileSection />);

    expect(await screen.findByLabelText("Startup adı")).toHaveValue("Döngü");
    expect(screen.getByLabelText("Web sitesi")).toHaveValue("dongu.co");
    expect(screen.getByLabelText("Problem")).toHaveValue(
      "Gönüllüler bulunamıyor",
    );
    expect(screen.getByLabelText("Sektör")).toHaveValue("SaaS");
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

    await user.type(screen.getByLabelText("Sektör"), "X");
    expect(save).toBeEnabled();
  });

  it("saves the edited profile and confirms it", async () => {
    vi.mocked(saveStartupProfile).mockResolvedValue(
      profile({ sector: "HealthTech" }),
    );
    const user = userEvent.setup();
    render(<StartupProfileSection />);

    const sector = await screen.findByLabelText("Sektör");
    await user.clear(sector);
    await user.type(sector, "HealthTech");
    await user.click(
      screen.getByRole("button", { name: "Değişiklikleri kaydet" }),
    );

    await waitFor(() =>
      expect(vi.mocked(saveStartupProfile)).toHaveBeenCalledWith(
        expect.objectContaining({ sector: "HealthTech", name: "Döngü" }),
        // TanStack passes a mutation context as a second argument.
        expect.anything(),
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

    await user.type(await screen.findByLabelText("Sektör"), "X");
    await user.click(
      screen.getByRole("button", { name: "Değişiklikleri kaydet" }),
    );

    expect(
      await screen.findByText("Startup profile could not be saved."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Kaydedildi")).not.toBeInTheDocument();
  });
});
