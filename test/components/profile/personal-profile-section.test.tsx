import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersonalProfileSection } from "@/components/profile/personal-profile-section";
import type { UserProfile } from "@/interfaces/user-profile";
import { ClientApiError } from "@/lib/client/api";
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

  // The query context used to arrive as getUserProfile's idToken, so every
  // load sent "Bearer [object Object]" and the page showed a session error.
  it("loads the profile without passing anything as a bearer token", async () => {
    render(<PersonalProfileSection />);

    await screen.findByText("Gülse Buran");
    expect(getUserProfile).toHaveBeenCalledWith();
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

  it("marks the required name and explains its validation error", async () => {
    const user = userEvent.setup();
    render(<PersonalProfileSection />);

    const label = await screen.findByText("Ad soyad", { selector: "label" });
    expect(label).toHaveTextContent("Ad soyad *");
    await user.click(
      screen.getByRole("button", { name: "Ad soyad alanını düzenle" }),
    );
    await user.clear(screen.getByRole("textbox", { name: "Ad soyad*" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Ad soyad zorunludur.");
    expect(
      screen.getByRole("button", { name: "Değişiklikleri kaydet" }),
    ).toBeDisabled();
  });

  it("accepts only digits in the editable phone field", async () => {
    const user = userEvent.setup();
    render(<PersonalProfileSection />);

    await user.click(
      await screen.findByRole("button", { name: "Telefon alanını düzenle" }),
    );
    const phone = screen.getByLabelText("Telefon");
    await user.clear(phone);
    await user.type(phone, "+90abc555");

    expect(phone).toHaveValue("+90555");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Türkiye numarası +90'dan sonra 10 haneli olmalıdır.",
    );
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

    // Only the draft: a second argument would be sent as the bearer token.
    await waitFor(() =>
      expect(vi.mocked(saveUserProfile)).toHaveBeenCalledWith(
        expect.objectContaining({
          jobTitle: "Kurucu",
          fullName: "Gülse Buran",
        }),
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

  it("places backend validation feedback beside the affected field", async () => {
    vi.mocked(saveUserProfile).mockRejectedValue(
      new ClientApiError("Request validation failed", 400, undefined, {
        jobTitle: "Rol en fazla 100 karakter olabilir.",
      }),
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
      await screen.findByText("Rol en fazla 100 karakter olabilir."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Rol")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
