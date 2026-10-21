import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMeetingsAwaitingFeedback } from "@/hooks/use-meetings-awaiting-feedback";
import { getRatedMeetingIds } from "@/lib/client/meetings";
import { menteeMeetingFixture } from "@test/fixtures/mentee-home";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/meetings", () => ({ getRatedMeetingIds: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("useMeetingsAwaitingFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checks every held meeting in one call and keeps only the unrated ones", async () => {
    vi.mocked(getRatedMeetingIds).mockResolvedValue(["rated"]);
    const meetings = [
      menteeMeetingFixture({ id: "rated" }),
      menteeMeetingFixture({ id: "unrated" }),
    ];

    const { result } = renderHook(() => useMeetingsAwaitingFeedback(meetings), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoadingFeedback).toBe(false));
    expect(
      result.current.feedbackMeetings.map((meeting) => meeting.id),
    ).toEqual(["unrated"]);
    expect(getRatedMeetingIds).toHaveBeenCalledTimes(1);
    expect(getRatedMeetingIds).toHaveBeenCalledWith(["rated", "unrated"]);
  });

  it("asks nothing when no meeting has been held", () => {
    const { result } = renderHook(() => useMeetingsAwaitingFeedback([]), {
      wrapper,
    });

    expect(result.current.feedbackMeetings).toEqual([]);
    expect(result.current.isLoadingFeedback).toBe(false);
    expect(getRatedMeetingIds).not.toHaveBeenCalled();
  });
});
