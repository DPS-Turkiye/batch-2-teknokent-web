"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchMeetingBotStatus } from "@/lib/assistant";
import {
  isMeetingBotLive,
  meetingBotNotice,
  meetingBotNoticeTone,
} from "@/lib/meeting-bot";
import { POLL_INTERVAL, polling } from "@/lib/poll";
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

const LIVE_POLL = polling(POLL_INTERVAL.chat);
const SETTLED_POLL = polling(POLL_INTERVAL.background);

/**
 * The recording bot of the selected meeting, as Vexa sees it: whether it waits in the lobby, records, or could not
 * join. A finished bot is still checked now and then, because the user may send a new one.
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
      isMeetingBotLive(current.state.data?.state)
        ? LIVE_POLL.refetchInterval()
        : SETTLED_POLL.refetchInterval(),
    meta: LIVE_POLL.meta,
  });

  const notice = watched
    ? meetingBotNotice(query.data ?? null, query.dataUpdatedAt)
    : null;

  return {
    botNotice: notice,
    botNoticeTone: notice
      ? meetingBotNoticeTone(notice)
      : MeetingBotNoticeTone.Info,
  };
}
