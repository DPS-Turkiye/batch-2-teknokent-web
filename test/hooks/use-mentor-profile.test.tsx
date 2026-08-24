import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MENTOR_AVAILABILITY_QUERY_KEY,
  MENTOR_PROFILE_QUERY_KEY,
  useAvailabilitySlotForm,
  useCreateAvailabilitySlot,
  useDeleteAvailabilitySlot,
  useMentorProfileForm,
  useUpdateMentorProfile,
} from "@/hooks/use-mentor-profile";
import type { MentorProfile } from "@/interfaces/mentor";
import {
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  updateMentorProfile,
} from "@/lib/client/mentor-profile";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/mentor-profile", () => ({
  getMentorProfile: vi.fn(),
  updateMentorProfile: vi.fn(),
  getMentorAvailability: vi.fn(),
  createAvailabilitySlot: vi.fn(),
  deleteAvailabilitySlot: vi.fn(),
}));

function wrapperFor(queryClient: ReturnType<typeof createTestQueryClient>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("mentor profile mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates the profile query after a successful update", async () => {
    vi.mocked(updateMentorProfile).mockResolvedValue({} as never);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateMentorProfile(), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({
      professionalTitle: "Mentor",
      company: "Acme",
      availabilityLabel: "",
      responseTimeLabel: "",
      meetingMode: "",
      communicationPreference: "",
      mentoringStyle: "",
      fitLabel: "",
      experienceLevel: "",
      sectorExperience: "",
      startupStages: "",
      specialties: [],
    });

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: MENTOR_PROFILE_QUERY_KEY,
      }),
    );
  });

  it("invalidates the availability query after creating a slot", async () => {
    vi.mocked(createAvailabilitySlot).mockResolvedValue({} as never);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateAvailabilitySlot(), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({
      startsAt: "2026-08-25T10:00:00.000Z",
      durationMinutes: 60,
    });

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: MENTOR_AVAILABILITY_QUERY_KEY,
      }),
    );
  });

  it("invalidates the availability query after deleting a slot", async () => {
    vi.mocked(deleteAvailabilitySlot).mockResolvedValue(undefined as never);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteAvailabilitySlot(), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate("slot-1");

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: MENTOR_AVAILABILITY_QUERY_KEY,
      }),
    );
  });
});

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

describe("useMentorProfileForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes the form from the given profile", () => {
    const { result } = renderHook(() => useMentorProfileForm(profile()), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    expect(result.current.form.company).toBe("Döngü Labs");
    expect(result.current.form.specialties).toEqual([
      "Sürdürülebilir iş modeli",
    ]);
  });

  it("adds and removes a specialty locally", () => {
    const { result } = renderHook(() => useMentorProfileForm(profile()), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    act(() => {
      result.current.setSpecialtyInput("Karbon ölçümü");
    });
    act(() => {
      result.current.addSpecialty();
    });

    expect(result.current.form.specialties).toEqual([
      "Sürdürülebilir iş modeli",
      "Karbon ölçümü",
    ]);

    act(() => {
      result.current.removeSpecialty("Sürdürülebilir iş modeli");
    });

    expect(result.current.form.specialties).toEqual(["Karbon ölçümü"]);
  });

  it("saves the form through the update mutation and reports success", async () => {
    vi.mocked(updateMentorProfile).mockResolvedValue(profile() as never);
    const { result } = renderHook(() => useMentorProfileForm(profile()), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(updateMentorProfile).toHaveBeenCalled();
    expect(result.current.saveSuccess).toBe(true);
  });

  it("reports an error when saving fails", async () => {
    vi.mocked(updateMentorProfile).mockRejectedValue(
      new Error("Profil kaydedilemedi."),
    );
    const { result } = renderHook(() => useMentorProfileForm(profile()), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.saveError).toBe("Profil kaydedilemedi.");
  });
});

describe("useAvailabilitySlotForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds a slot and resets the form on success", async () => {
    vi.mocked(createAvailabilitySlot).mockResolvedValue({} as never);
    const { result } = renderHook(() => useAvailabilitySlotForm(), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    await act(async () => {
      await result.current.handleAddSlot();
    });

    expect(createAvailabilitySlot).toHaveBeenCalled();
    expect(result.current.slotError).toBe("");
  });

  it("reports an error when adding a slot fails", async () => {
    vi.mocked(createAvailabilitySlot).mockRejectedValue(
      new Error("Zaman dilimi eklenemedi."),
    );
    const { result } = renderHook(() => useAvailabilitySlotForm(), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    await act(async () => {
      await result.current.handleAddSlot();
    });

    expect(result.current.slotError).toBe("Zaman dilimi eklenemedi.");
  });

  it("deletes a slot by id", async () => {
    vi.mocked(deleteAvailabilitySlot).mockResolvedValue(undefined as never);
    const { result } = renderHook(() => useAvailabilitySlotForm(), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    await act(async () => {
      await result.current.handleDeleteSlot("slot-1");
    });

    expect(deleteAvailabilitySlot).toHaveBeenCalledWith(
      "slot-1",
      expect.anything(),
    );
  });
});
