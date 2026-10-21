"use client";

import { useQuery } from "@tanstack/react-query";

import type { MeetingItem } from "@/interfaces/meeting";
import { getRatedMeetingIds } from "@/lib/client/meetings";
import { HOME_TASK_FEEDBACK_MEETING_LIMIT } from "@/lib/const";

export const RATED_MEETINGS_QUERY_KEY = ["meeting-feedback", "rated"] as const;

/** The newest held meetings the mentee has not rated yet, checked in one call. */
export function useMeetingsAwaitingFeedback(heldMeetings: MeetingItem[]) {
  const candidates = heldMeetings.slice(0, HOME_TASK_FEEDBACK_MEETING_LIMIT);
  const ids = candidates.map((meeting) => meeting.id);
  const { data: rated, isLoading } = useQuery({
    queryKey: [...RATED_MEETINGS_QUERY_KEY, ids],
    queryFn: () => getRatedMeetingIds(ids),
    enabled: ids.length > 0,
  });
  return {
    feedbackMeetings: rated
      ? candidates.filter((meeting) => !rated.includes(meeting.id))
      : [],
    isLoadingFeedback: isLoading,
  };
}
