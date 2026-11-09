"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToast } from "@/stores/toast-store";
import { useUpdateMeeting } from "@/hooks/use-meetings";
import type { MeetingItem } from "@/interfaces/meeting";
import { ToastTone } from "@/interfaces/toast";

/**
 * The next meeting banner: its Meet link and whether a transcript is wanted.
 * The link is saved when the field is left, the toggle as soon as it changes,
 * so the banner needs no save button of its own. The caller keys the banner on
 * the meeting id, so a different meeting starts from that meeting's own link.
 */
export function useMentorNextMeeting(meeting: MeetingItem | undefined) {
  const t = useTranslations("mentorHome.banner");
  const { showToast } = useToast();
  const updateMeeting = useUpdateMeeting(meeting?.id);
  const [link, setLink] = useState(meeting?.meetLink ?? "");
  const [savedLink, setSavedLink] = useState(meeting?.meetLink ?? "");

  const save = async (payload: {
    meetLink?: string;
    transcribeRequested?: boolean;
  }) => {
    if (!meeting) return false;
    try {
      await updateMeeting.mutateAsync(payload);
      return true;
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : t("updateFailed"),
        tone: ToastTone.Error,
      });
      return false;
    }
  };

  const saveLink = async () => {
    const meetLink = link.trim();
    if (!meeting || meetLink === savedLink) return;
    if (await save({ meetLink })) {
      setSavedLink(meetLink);
      showToast({ message: t("linkSaved"), tone: ToastTone.Success });
    }
  };

  const toggleTranscript = async () => {
    if (!meeting) return;
    await save({ transcribeRequested: !meeting.transcribeRequested });
  };

  return {
    meeting,
    link,
    setLink,
    saveLink,
    transcribeRequested: meeting?.transcribeRequested ?? false,
    toggleTranscript,
    isSaving: updateMeeting.isPending,
    joinHref: meeting?.meetLink?.trim() || null,
  };
}
