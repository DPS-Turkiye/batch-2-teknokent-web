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
  const [sent, setSent] = useState(false);

  const target = toAssistantMeeting(meeting, { meetingFallback: "", locale });
  const canSend =
    meeting.status === CalendarStatus.Scheduled &&
    target.status !== MeetingStatus.Completed &&
    Boolean(target.nativeMeetingId);
  const bookedBotMayBeThere =
    target.status === MeetingStatus.Active ||
    target.status === MeetingStatus.Joining;
  const { botNotice } = useMeetingBotState(
    canSend && (sent || bookedBotMayBeThere) ? target : null,
  );

  const send = useMutation({
    mutationFn: async () => {
      await addMeetingBot(meeting.meetLink?.trim() ?? "");
      if (meeting.transcribeRequested) return;
      // Recorded meetings are the ones the backend follows to the end and writes a report for. It is not marked as
      // sent here: the backend does that at the start time, so a bot sent days early does not replace that visit.
      try {
        await updateMeeting.mutateAsync({ transcribeRequested: true });
      } catch (error) {
        console.error("Failed to mark the meeting as recorded", error);
      }
    },
    onSuccess: async () => {
      setSent(true);
      showToast({ message: t("sent"), tone: ToastTone.Success });
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
    isInMeeting: botNotice !== null && IN_THE_MEETING.includes(botNotice),
    botNotice,
  };
}
