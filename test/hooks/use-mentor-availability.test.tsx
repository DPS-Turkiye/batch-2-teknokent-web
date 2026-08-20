import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCreateMentorAvailabilitySlot,
  useDeleteMentorAvailabilitySlot,
  useOwnMentorAvailability,
} from "@/hooks/use-mentor-availability";
import {
  createMentorAvailabilitySlot,
  deleteMentorAvailabilitySlot,
  getOwnMentorAvailability,
} from "@/lib/client/mentors";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/mentors", () => ({
  createMentorAvailabilitySlot: vi.fn(),
  deleteMentorAvailabilitySlot: vi.fn(),
  getOwnMentorAvailability: vi.fn(),
}));

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useOwnMentorAvailability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not query when mentorId is null", () => {
    const { result } = renderHook(() => useOwnMentorAvailability(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(getOwnMentorAvailability).not.toHaveBeenCalled();
  });

  it("fetches when a mentorId is provided", async () => {
    vi.mocked(getOwnMentorAvailability).mockResolvedValue([
      {
        id: "slot-1",
        startsAt: "2026-08-21T10:00:00.000Z",
        durationMinutes: 60,
      },
    ]);

    const { result } = renderHook(() => useOwnMentorAvailability("mentor-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getOwnMentorAvailability).toHaveBeenCalledWith("mentor-1");
    expect(result.current.data).toHaveLength(1);
  });
});

describe("useCreateMentorAvailabilitySlot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a slot for the given mentor", async () => {
    vi.mocked(createMentorAvailabilitySlot).mockResolvedValue({
      id: "slot-1",
      startsAt: "2026-08-21T10:00:00.000Z",
      durationMinutes: 60,
    });

    const { result } = renderHook(
      () => useCreateMentorAvailabilitySlot("mentor-1"),
      { wrapper: createWrapper() },
    );

    await result.current.mutateAsync({ startsAt: "2026-08-21T10:00:00.000Z" });

    expect(createMentorAvailabilitySlot).toHaveBeenCalledWith({
      mentorId: "mentor-1",
      startsAt: "2026-08-21T10:00:00.000Z",
    });
  });
});

describe("useDeleteMentorAvailabilitySlot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a slot for the given mentor", async () => {
    vi.mocked(deleteMentorAvailabilitySlot).mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useDeleteMentorAvailabilitySlot("mentor-1"),
      { wrapper: createWrapper() },
    );

    await result.current.mutateAsync("slot-1");

    expect(deleteMentorAvailabilitySlot).toHaveBeenCalledWith({
      mentorId: "mentor-1",
      slotId: "slot-1",
    });
  });
});
