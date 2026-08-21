import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import MentorProfilePage from "@/app/mentor-profile/page";
import {
  useCreateAvailabilitySlot,
  useDeleteAvailabilitySlot,
  useMentorAvailabilitySlots,
  useMentorProfile,
  useUpdateMentorProfile,
} from "@/hooks/use-mentor-profile";
import type {
  MentorAvailabilitySlot,
  MentorProfile,
} from "@/interfaces/mentor";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/use-mentor-profile", () => ({
  useMentorProfile: vi.fn(),
  useUpdateMentorProfile: vi.fn(),
  useMentorAvailabilitySlots: vi.fn(),
  useCreateAvailabilitySlot: vi.fn(),
  useDeleteAvailabilitySlot: vi.fn(),
}));

function profile(overrides: Partial<MentorProfile> = {}): MentorProfile {
  return {
    id: "mentor-1",
    fullName: "Leyla Aksoy",
    email: "leyla.aksoy@teknokent.demo",
    initials: "LA",
    professionalTitle: "ClimateTech Kurucusu",
    company: "Döngü Labs",
    availabilityLabel: "İki hafta içinde müsait",
    responseTimeLabel: "~48 saat",
    meetingMode: "Online",
    communicationPreference: "Mesajlaşma açık",
    mentoringStyle: "İşbirlikçi",
    fitLabel: "Yüksek",
    experienceLevel: "İklim teknolojileri",
    sectorExperience: "ClimateTech",
    startupStages: "MVP & Büyüme",
    specialties: ["Sürdürülebilir iş modeli"],
    recommendationReasons: [],
    recommendationEvidence: [],
    ...overrides,
  };
}

function slot(
  overrides: Partial<MentorAvailabilitySlot> = {},
): MentorAvailabilitySlot {
  return {
    id: "slot-1",
    startsAt: "2026-08-22T07:00:00.000Z",
    durationMinutes: 60,
    booked: false,
    ...overrides,
  };
}

describe("MentorProfilePage", () => {
  it("pre-fills the form with the loaded profile", () => {
    vi.mocked(useMentorProfile).mockReturnValue({
      data: profile(),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useMentorProfile>);
    vi.mocked(useUpdateMentorProfile).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateMentorProfile>);
    vi.mocked(useMentorAvailabilitySlots).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useMentorAvailabilitySlots>);
    vi.mocked(useCreateAvailabilitySlot).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateAvailabilitySlot>);
    vi.mocked(useDeleteAvailabilitySlot).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteAvailabilitySlot>);

    renderWithQueryClient(<MentorProfilePage />);

    expect(screen.getByDisplayValue("Döngü Labs")).toBeInTheDocument();
    expect(screen.getByText("Sürdürülebilir iş modeli")).toBeInTheDocument();
  });

  it("saves edited fields through the update mutation", async () => {
    const mutateAsync = vi.fn().mockResolvedValue(profile());
    vi.mocked(useMentorProfile).mockReturnValue({
      data: profile(),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useMentorProfile>);
    vi.mocked(useUpdateMentorProfile).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateMentorProfile>);
    vi.mocked(useMentorAvailabilitySlots).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useMentorAvailabilitySlots>);
    vi.mocked(useCreateAvailabilitySlot).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateAvailabilitySlot>);
    vi.mocked(useDeleteAvailabilitySlot).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteAvailabilitySlot>);

    const user = userEvent.setup();
    renderWithQueryClient(<MentorProfilePage />);

    const companyInput = screen.getByDisplayValue("Döngü Labs");
    await user.clear(companyInput);
    await user.type(companyInput, "Yeni Şirket");
    await user.click(screen.getByRole("button", { name: "Profili Kaydet" }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ company: "Yeni Şirket" }),
      ),
    );
    expect(screen.getByText("Profil güncellendi.")).toBeInTheDocument();
  });

  it("renders availability slots and removes one via the delete mutation", async () => {
    const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useMentorProfile).mockReturnValue({
      data: profile(),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useMentorProfile>);
    vi.mocked(useUpdateMentorProfile).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateMentorProfile>);
    vi.mocked(useMentorAvailabilitySlots).mockReturnValue({
      data: [slot()],
      isLoading: false,
    } as ReturnType<typeof useMentorAvailabilitySlots>);
    vi.mocked(useCreateAvailabilitySlot).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateAvailabilitySlot>);
    vi.mocked(useDeleteAvailabilitySlot).mockReturnValue({
      mutateAsync: deleteMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteAvailabilitySlot>);

    const user = userEvent.setup();
    renderWithQueryClient(<MentorProfilePage />);

    expect(screen.getByText(/60 dk/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Kaldır" }));

    await waitFor(() =>
      expect(deleteMutateAsync).toHaveBeenCalledWith("slot-1"),
    );
  });

  it("disables removing a booked slot", () => {
    vi.mocked(useMentorProfile).mockReturnValue({
      data: profile(),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useMentorProfile>);
    vi.mocked(useUpdateMentorProfile).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateMentorProfile>);
    vi.mocked(useMentorAvailabilitySlots).mockReturnValue({
      data: [slot({ booked: true })],
      isLoading: false,
    } as ReturnType<typeof useMentorAvailabilitySlots>);
    vi.mocked(useCreateAvailabilitySlot).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateAvailabilitySlot>);
    vi.mocked(useDeleteAvailabilitySlot).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteAvailabilitySlot>);

    renderWithQueryClient(<MentorProfilePage />);

    expect(screen.getByRole("button", { name: "Kaldır" })).toBeDisabled();
  });
});
