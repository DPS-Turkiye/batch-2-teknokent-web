import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MENTOR_AVAILABILITY_QUERY_KEY,
  MENTOR_PROFILE_QUERY_KEY,
  useCreateAvailabilitySlot,
  useDeleteAvailabilitySlot,
  useUpdateMentorProfile,
} from "@/hooks/use-mentor-profile";
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
