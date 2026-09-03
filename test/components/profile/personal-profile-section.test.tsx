import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersonalProfileSection } from "@/components/profile/personal-profile-section";
import type { UserProfile } from "@/interfaces/user-profile";
import { getUserProfile, saveUserProfile } from "@/lib/client/user-profile";
import { renderWithQueryClient as render } from "@test/test-utils";

vi.mock("@/lib/client/user-profile", () => ({
  getUserProfile: vi.fn(),
  saveUserProfile: vi.fn(),
}));

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "user-1",
    fullName: "Gülse Buran",
    email: "gulse@dongu.co",
    jobTitle: "Designer",
    phone: "+905551112233",
    bio: "Ürün odaklı kurucu",
    linkedinUrl: "linkedin.com/in/gulse",
    expertise: ["UI/UX", "Figma"],
    ...overrides,
  };
}

describe("PersonalProfileSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserProfile).mockResolvedValue(profile());
  });

  // These three were stored by V33 and never displayed anywhere until now.
  it("shows the bio, LinkedIn and expertise that were previously write-only", async () => {
    render(<PersonalProfileSection />);

    expect(await screen.findByText("Ürün odaklı kurucu")).toBeInTheDocument();
    expect(screen.getByText("linkedin.com/in/gulse")).toBeInTheDocument();
    expect(screen.getByText("UI/UX")).toBeInTheDocument();
    expect(screen.getByText("Figma")).toBeInTheDocument();
    expect(screen.getByText("Gülse Buran")).toBeInTheDocument();
  });

  it("keeps save disabled until something changes", async () => {
    const user = userEvent.setup();
    render(<PersonalProfileSection />);

    const save = await screen.findByRole("button", {
      name: "Değişiklikleri kaydet",
    });
    expect(save).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Rol alanını düzenle" }),
    );
    await user.type(screen.getByLabelText("Rol"), "X");
    expect(save).toBeEnabled();
  });

  it("saves the edited profile and confirms it", async () => {
    vi.mocked(saveUserProfile).mockResolvedValue(
      profile({ jobTitle: "Kurucu" }),
    );
    const user = userEvent.setup();
    render(<PersonalProfileSection />);

    await user.click(
      await screen.findByRole("button", { name: "Rol alanını düzenle" }),
    );
    const role = screen.getByLabelText("Rol");
    await user.clear(role);
    await user.type(role, "Kurucu");
    await user.click(
      screen.getByRole("button", { name: "Değişiklikleri kaydet" }),
    );

    await waitFor(() =>
      expect(vi.mocked(saveUserProfile)).toHaveBeenCalledWith(
        expect.objectContaining({
          jobTitle: "Kurucu",
          fullName: "Gülse Buran",
        }),
        // TanStack passes a mutation context as a second argument.
        expect.anything(),
      ),
    );
    expect(await screen.findByText("Kaydedildi")).toBeInTheDocument();
  });

  it("reports a failed save instead of looking saved", async () => {
    vi.mocked(saveUserProfile).mockRejectedValue(
      new Error("Profile could not be saved."),
    );
    const user = userEvent.setup();
    render(<PersonalProfileSection />);

    await user.click(
      await screen.findByRole("button", { name: "Rol alanını düzenle" }),
    );
    await user.type(screen.getByLabelText("Rol"), "X");
    await user.click(
      screen.getByRole("button", { name: "Değişiklikleri kaydet" }),
    );

    expect(
      await screen.findByText("Profile could not be saved."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Kaydedildi")).not.toBeInTheDocument();
  });
});
