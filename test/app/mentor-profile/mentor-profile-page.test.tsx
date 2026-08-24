import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import MentorProfilePage from "@/app/mentor-profile/page";
import {
  useAvailabilitySlotForm,
  useMentorAvailabilitySlots,
  useMentorProfile,
  useMentorProfileForm,
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
  useMentorProfileForm: vi.fn(),
  useMentorAvailabilitySlots: vi.fn(),
  useAvailabilitySlotForm: vi.fn(),
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

function mockProfileForm(overrides: Record<string, unknown> = {}) {
  vi.mocked(useMentorProfileForm).mockReturnValue({
    form: profile(),
    specialtyInput: "",
    setSpecialtyInput: vi.fn(),
    saveError: "",
    saveSuccess: false,
    isSaving: false,
    updateField: vi.fn(),
    addSpecialty: vi.fn(),
    removeSpecialty: vi.fn(),
    handleSave: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useMentorProfileForm>);
}

function mockSlotForm(overrides: Record<string, unknown> = {}) {
  vi.mocked(useAvailabilitySlotForm).mockReturnValue({
    slotForm: { startsAt: "2026-08-22T10:00", durationMinutes: 60 },
    setSlotForm: vi.fn(),
    slotError: "",
    isCreating: false,
    isDeleting: false,
    handleAddSlot: vi.fn(),
    handleDeleteSlot: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useAvailabilitySlotForm>);
}

describe("MentorProfilePage", () => {
  it("renders the profile form once the profile loads", () => {
    vi.mocked(useMentorProfile).mockReturnValue({
      data: profile(),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useMentorProfile>);
    mockProfileForm();
    vi.mocked(useMentorAvailabilitySlots).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useMentorAvailabilitySlots>);
    mockSlotForm();

    renderWithQueryClient(<MentorProfilePage />);

    expect(screen.getByDisplayValue("Döngü Labs")).toBeInTheDocument();
    expect(screen.getByText("Sürdürülebilir iş modeli")).toBeInTheDocument();
  });

  it("calls handleSave when the save button is clicked", async () => {
    const handleSave = vi.fn();
    vi.mocked(useMentorProfile).mockReturnValue({
      data: profile(),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useMentorProfile>);
    mockProfileForm({ handleSave });
    vi.mocked(useMentorAvailabilitySlots).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useMentorAvailabilitySlots>);
    mockSlotForm();

    const user = userEvent.setup();
    renderWithQueryClient(<MentorProfilePage />);

    await user.click(screen.getByRole("button", { name: "Profili Kaydet" }));

    expect(handleSave).toHaveBeenCalled();
  });

  it("renders availability slots and calls handleDeleteSlot", async () => {
    const handleDeleteSlot = vi.fn();
    vi.mocked(useMentorProfile).mockReturnValue({
      data: profile(),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useMentorProfile>);
    mockProfileForm();
    vi.mocked(useMentorAvailabilitySlots).mockReturnValue({
      data: [slot()],
      isLoading: false,
    } as ReturnType<typeof useMentorAvailabilitySlots>);
    mockSlotForm({ handleDeleteSlot });

    const user = userEvent.setup();
    renderWithQueryClient(<MentorProfilePage />);

    expect(screen.getByText(/60 dk/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Kaldır" }));

    expect(handleDeleteSlot).toHaveBeenCalledWith("slot-1");
  });

  it("disables removing a booked slot", () => {
    vi.mocked(useMentorProfile).mockReturnValue({
      data: profile(),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useMentorProfile>);
    mockProfileForm();
    vi.mocked(useMentorAvailabilitySlots).mockReturnValue({
      data: [slot({ booked: true })],
      isLoading: false,
    } as ReturnType<typeof useMentorAvailabilitySlots>);
    mockSlotForm();

    renderWithQueryClient(<MentorProfilePage />);

    expect(screen.getByRole("button", { name: "Kaldır" })).toBeDisabled();
  });
});
