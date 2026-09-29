import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMentorMeetingEvaluation } from "@/hooks/use-mentor-meeting-evaluation";
import {
  getMeetingFeedback,
  getMeetings,
  postMeetingFeedback,
} from "@/lib/client/meetings";
import { getMentorRequests } from "@/lib/client/mentor-requests";
import { OutcomeClarity } from "@/types/mentor-evaluation";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/meetings", () => ({
  getMeetings: vi.fn(),
  getMeetingFeedback: vi.fn(),
  postMeetingFeedback: vi.fn(),
}));

vi.mock("@/lib/client/mentor-requests", () => ({
  getMentorRequests: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

const meeting = {
  id: "m1",
  organizationId: "org-1",
  organizationName: "Döngü",
  mentorshipRequestId: "r1",
  scheduledAt: "2026-09-05T11:00:00Z",
  durationMinutes: 45,
  agenda: "UX Flow Review",
  status: "COMPLETED",
};

describe("useMentorMeetingEvaluation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMeetings).mockResolvedValue([meeting]);
    vi.mocked(getMentorRequests).mockResolvedValue([
      { id: "r1", requesterName: "Gülse Buran" } as never,
    ]);
    vi.mocked(getMeetingFeedback).mockResolvedValue(null);
  });

  it("describes the meeting and waits for all three answers", async () => {
    const { result } = renderHook(() => useMentorMeetingEvaluation("m1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() =>
      expect(result.current.meta).toContain("Döngü · Gülse · UX Flow Review"),
    );
    expect(result.current.startupInitials).toBe("D");
    expect(result.current.isSent).toBe(false);
    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.setPreparedness(4));
    act(() => result.current.toggleQuality("Hazırlıklı"));
    expect(result.current.answered).toBe(2);
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.setClarity(OutcomeClarity.Partly));
    expect(result.current.canSubmit).toBe(true);
  });

  it("unticks a quality chosen twice", async () => {
    const { result } = renderHook(() => useMentorMeetingEvaluation("m1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.toggleQuality("Odaklı"));
    act(() => result.current.toggleQuality("Odaklı"));

    expect(result.current.answers.qualities).toEqual([]);
  });

  it("sends the answers and switches to the sent state", async () => {
    vi.mocked(postMeetingFeedback).mockResolvedValue({ id: "f1" });
    const { result } = renderHook(() => useMentorMeetingEvaluation("m1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setPreparedness(5);
      result.current.toggleQuality("Saygılı");
      result.current.setClarity(OutcomeClarity.Yes);
      result.current.setNote("Metrikleri getirsinler.");
    });
    act(() => result.current.submit());

    await waitFor(() => expect(result.current.isSent).toBe(true));
    expect(postMeetingFeedback).toHaveBeenCalledWith("m1", {
      ratings: [5, 5],
      benefits: ["Saygılı", "Metrikleri getirsinler."],
    });
  });

  it("opens straight on the sent state when the mentor already evaluated it", async () => {
    vi.mocked(getMeetingFeedback).mockResolvedValue({
      id: "f1",
      meetingId: "m1",
      authorId: "mentor-1",
      ratings: [4, 3],
      benefits: [],
      createdAt: "2026-09-05T12:00:00Z",
    });
    const { result } = renderHook(() => useMentorMeetingEvaluation("m1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSent).toBe(true));
  });
});
