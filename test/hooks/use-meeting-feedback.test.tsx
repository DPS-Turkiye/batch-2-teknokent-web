import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Toaster } from "@/components/common/toaster";
import { useMeetingFeedback } from "@/hooks/use-meeting-lifecycle";
import {
  getMeetingFeedback,
  type MeetingFeedbackItem,
} from "@/lib/client/meetings";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/meetings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/meetings")>()),
  getMeetingFeedback: vi.fn(),
  postMeetingFeedback: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <>
        {children}
        <Toaster />
      </>
    </QueryClientProvider>
  );
}

describe("useMeetingFeedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads the saved evaluation of the meeting the page resolved", async () => {
    vi.mocked(getMeetingFeedback).mockResolvedValue({
      id: "feedback-1",
      meetingId: "meeting-1",
      authorId: "mentee-1",
      ratings: [5, 4, 5],
      benefits: [],
      createdAt: "2026-11-04T09:00:00Z",
    } satisfies MeetingFeedbackItem);

    const { result } = renderHook(() => useMeetingFeedback("meeting-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isFeedbackLoading).toBe(false));
    expect(getMeetingFeedback).toHaveBeenCalledWith("meeting-1");
    expect(result.current.readOnly).toBe(true);
  });

  it("does not wait forever when there is no meeting to load", () => {
    const { result } = renderHook(() => useMeetingFeedback(null), { wrapper });

    expect(result.current.isFeedbackLoading).toBe(false);
    expect(getMeetingFeedback).not.toHaveBeenCalled();
  });
});
