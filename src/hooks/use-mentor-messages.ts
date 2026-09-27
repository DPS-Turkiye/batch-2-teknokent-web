"use client";

import { useMemo, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { useMeetings } from "@/hooks/use-meetings";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { useProgramThreads } from "@/hooks/use-program-threads";
import {
  useMentorMessageForm,
  useMentorshipRequests,
  useRequestFileUpload,
} from "@/hooks/use-mentorship-requests";
import { conversationMeetingLabel } from "@/lib/mentor-dashboard";
import {
  mentorshipRequestAllowsMessaging,
  pickRequestMeeting,
} from "@/lib/mentorship-workspace";

export function useMentorMessages(preferredRequestId?: string | null) {
  const { session } = useSession();
  const requestsQuery = useMentorshipRequests(UserRole.Mentor);
  const meetingsQuery = useMeetings();
  const preferred = preferredRequestId ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const programThreads = useProgramThreads();
  const [syncedPreferred, setSyncedPreferred] = useState(preferred);

  if (syncedPreferred !== preferred) {
    setSyncedPreferred(preferred);
    setSelectedId(null);
  }

  const conversations = useMemo<MentorshipRequest[]>(
    () =>
      (requestsQuery.data ?? []).filter((request) =>
        mentorshipRequestAllowsMessaging(request.status),
      ),
    [requestsQuery.data],
  );

  const activeId =
    (selectedId && conversations.some((item) => item.id === selectedId)
      ? selectedId
      : null) ??
    (preferred && conversations.some((item) => item.id === preferred)
      ? preferred
      : null) ??
    conversations[0]?.id ??
    null;

  const active = conversations.find((item) => item.id === activeId) ?? null;
  const messageForm = useMentorMessageForm(activeId);
  const fileUpload = useRequestFileUpload(activeId, UserRole.Mentor);
  const activeMeeting = active
    ? pickRequestMeeting(meetingsQuery.data ?? [], active)
    : null;

  return {
    active,
    activeId,
    activeMeeting,
    conversations,
    error: requestsQuery.error,
    fileUpload,
    isLoading: requestsQuery.isLoading,
    meetingLabel: conversationMeetingLabel(activeMeeting),
    messageForm,
    programThreads,
    select: (id: string) => {
      programThreads.close();
      setSelectedId(id);
    },
    viewerUserId: session?.userId ?? "",
  };
}
