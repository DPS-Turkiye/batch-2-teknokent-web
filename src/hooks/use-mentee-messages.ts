"use client";

import { useMemo, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import {
  useMentorshipRequests,
  useReplyForm,
  useRequestFileUpload,
} from "@/hooks/use-mentorship-requests";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { mentorshipRequestAllowsMessaging } from "@/lib/mentorship-workspace";
import { useMyAnnouncements } from "@/hooks/use-program-announcements";
import { useProgramThreads } from "@/hooks/use-program-threads";

export function useMenteeMessages() {
  const { session } = useSession();
  const requestsQuery = useMentorshipRequests(UserRole.Mentee);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const programThreads = useProgramThreads();
  const announcements = useMyAnnouncements();
  const conversations = useMemo<MentorshipRequest[]>(
    () =>
      (requestsQuery.data ?? []).filter((request) =>
        mentorshipRequestAllowsMessaging(request.status),
      ),
    [requestsQuery.data],
  );
  const activeId =
    selectedId && conversations.some((item) => item.id === selectedId)
      ? selectedId
      : (conversations[0]?.id ?? null);

  return {
    active: conversations.find((request) => request.id === activeId) ?? null,
    activeId,
    conversations,
    error: requestsQuery.error,
    fileUpload: useRequestFileUpload(activeId, UserRole.Mentee),
    isLoading: requestsQuery.isLoading,
    messageForm: useReplyForm(activeId),
    programThreads,
    announcements,
    openProgramThread: (id: string) => {
      announcements.close();
      programThreads.open(id);
    },
    openAnnouncements: (programId: string) => {
      programThreads.close();
      announcements.open(programId);
    },
    select: (id: string) => {
      programThreads.close();
      announcements.close();
      setSelectedId(id);
    },
    viewerUserId: session?.userId ?? "",
  };
}
