"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchMeetingBotStatus } from "@/lib/assistant";
import {
  meetingBotNotice,
  meetingBotNoticeTone,
  meetingBotPollMs,
} from "@/lib/meeting-bot";
import { polling } from "@/lib/poll";
import {
  MeetingBotNoticeTone,
  MeetingStatus,
  type Meeting,
} from "@/types/assistant";

export const MEETING_BOT_STATE_QUERY_KEY = ["meeting-bot-state"] as const;

export function meetingBotStateQueryKey(
  platform: string,
  nativeMeetingId: string,
) {
  return [...MEETING_BOT_STATE_QUERY_KEY, platform, nativeMeetingId] as const;
}

/**
 * The recording bot of the selected meeting, as Vexa sees it: whether it waits in the lobby, records, or could not
 * join. A finished bot is still checked, because the user may send a new one.
 */
export function useMeetingBotState(meeting: Meeting | null | undefined) {
  const platform = meeting?.platformKey ?? "";
  const nativeMeetingId = meeting?.nativeMeetingId ?? "";
  const watched =
    Boolean(platform && nativeMeetingId) &&
    meeting?.status !== MeetingStatus.Completed;

  const query = useQuery({
    queryKey: meetingBotStateQueryKey(platform, nativeMeetingId),
    queryFn: () => fetchMeetingBotStatus(platform, nativeMeetingId),
    enabled: watched,
    refetchInterval: (current) =>
      polling(meetingBotPollMs(current.state.data?.state)).refetchInterval(),
    refetchOnWindowFocus: true,
    meta: { polled: true },
  });

  // After a failed refresh the last answer may no longer be true, so say nothing rather than "recording".
  const notice =
    watched && !query.isError
      ? meetingBotNotice(query.data ?? null, query.dataUpdatedAt)
      : null;

  return {
    botNotice: notice,
    botNoticeTone: notice
      ? meetingBotNoticeTone(notice)
      : MeetingBotNoticeTone.Info,
  };
}
