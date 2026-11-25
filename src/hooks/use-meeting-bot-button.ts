"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  meetingBotStateQueryKey,
  useMeetingBotState,
} from "@/hooks/use-meeting-bot-state";
import { useUpdateMeeting } from "@/hooks/use-meetings";
import {
  MeetingStatus as CalendarStatus,
  type MeetingItem,
} from "@/interfaces/meeting";
import { ToastTone } from "@/interfaces/toast";
import { addMeetingBot } from "@/lib/assistant";
import { toAssistantMeeting } from "@/lib/assistant-meetings";
import { useToast } from "@/stores/toast-store";
import { MeetingBotNotice, MeetingStatus } from "@/types/assistant";

const IN_THE_MEETING: readonly MeetingBotNotice[] = [
  MeetingBotNotice.Joining,
  MeetingBotNotice.WaitingForAdmission,
  MeetingBotNotice.WaitingTooLong,
  MeetingBotNotice.Recording,
];

/** Sends the recording bot to the mentor's meeting at once, instead of waiting for its start time. */
export function useMeetingBotButton(meeting: MeetingItem) {
  const t = useTranslations("meetingBotButton");
  const locale = useLocale();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const updateMeeting = useUpdateMeeting(meeting.id);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const target = toAssistantMeeting(meeting, { meetingFallback: "", locale });
  const canSend =
    meeting.status === CalendarStatus.Scheduled &&
    target.status !== MeetingStatus.Completed &&
    Boolean(target.nativeMeetingId);
  const bookedBotMayBeThere =
    target.status === MeetingStatus.Active ||
    target.status === MeetingStatus.Joining;
  const sent = sentTo !== null && sentTo === target.nativeMeetingId;
  const { botNotice: latestNotice } = useMeetingBotState(
    canSend && (sent || bookedBotMayBeThere || meeting.transcribeRequested)
      ? target
      : null,
  );
  const isInMeeting =
    latestNotice !== null && IN_THE_MEETING.includes(latestNotice);
  // A reused room still answers with the bot of an earlier meeting, so before the start only a live bot is shown.
  const botNotice =
    sent || bookedBotMayBeThere || isInMeeting ? latestNotice : null;

  const send = useMutation({
    mutationFn: async () => {
      await addMeetingBot(meeting.meetLink?.trim() ?? "");
      if (meeting.transcribeRequested) return { marked: true };
      // Recorded meetings are the ones the backend follows to the end and writes a report for. It is not marked as
      // sent here: the backend does that at the start time, so a bot sent days early does not replace that visit.
      try {
        await updateMeeting.mutateAsync({ transcribeRequested: true });
        return { marked: true };
      } catch (error) {
        console.error("Failed to mark the meeting as recorded", error);
        return { marked: false };
      }
    },
    onSuccess: async ({ marked }) => {
      setSentTo(target.nativeMeetingId);
      showToast(
        marked
          ? { message: t("sent"), tone: ToastTone.Success }
          : { message: t("sentNotMarked"), tone: ToastTone.Error },
      );
      await queryClient.invalidateQueries({
        queryKey: meetingBotStateQueryKey(
          target.platformKey,
          target.nativeMeetingId,
        ),
      });
    },
    onError: (error) =>
      showToast({
        message: error instanceof Error ? error.message : t("failed"),
        tone: ToastTone.Error,
      }),
  });

  return {
    canSend,
    send: () => send.mutate(),
    isSending: send.isPending,
    isInMeeting,
    botNotice,
  };
}
