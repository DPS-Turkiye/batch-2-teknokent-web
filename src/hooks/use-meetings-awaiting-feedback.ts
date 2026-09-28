"use client";

import { useQueries } from "@tanstack/react-query";

import type { MeetingItem } from "@/interfaces/meeting";
import { getMeetingFeedback } from "@/lib/client/meetings";
import { HOME_TASK_FEEDBACK_MEETING_LIMIT } from "@/lib/const";

/** The newest held meetings the mentee has not rated yet. */
export function useMeetingsAwaitingFeedback(heldMeetings: MeetingItem[]) {
  const candidates = heldMeetings.slice(0, HOME_TASK_FEEDBACK_MEETING_LIMIT);
  return useQueries({
    queries: candidates.map((meeting) => ({
      queryKey: ["meeting-feedback", meeting.id],
      queryFn: () => getMeetingFeedback(meeting.id),
    })),
    combine: (results) => ({
      feedbackMeetings: candidates.filter((_, index) => {
        const result = results[index];
        return Boolean(result && !result.isLoading && !result.data);
      }),
      isLoadingFeedback: results.some((result) => result.isLoading),
    }),
  });
}
