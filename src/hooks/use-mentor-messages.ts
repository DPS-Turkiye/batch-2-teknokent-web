"use client";

import { useMemo, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import {
  useMentorMessageForm,
  useMentorshipRequests,
} from "@/hooks/use-mentorship-requests";

export function useMentorMessages() {
  const { session } = useSession();
  const requestsQuery = useMentorshipRequests(UserRole.Mentor);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Messaging opens only once a request is accepted; the backend refuses a
  // mentor message on any other status, so the list mirrors that rule.
  const conversations = useMemo<MentorshipRequest[]>(
    () =>
      (requestsQuery.data ?? []).filter(
        (request) => request.status === MentorshipRequestStatus.Accepted,
      ),
    [requestsQuery.data],
  );

  const activeId =
    selectedId && conversations.some((item) => item.id === selectedId)
      ? selectedId
      : (conversations[0]?.id ?? null);

  const active = conversations.find((item) => item.id === activeId) ?? null;
  const messageForm = useMentorMessageForm(activeId);

  return {
    active,
    activeId,
    conversations,
    error: requestsQuery.error,
    isLoading: requestsQuery.isLoading,
    messageForm,
    select: setSelectedId,
    viewerUserId: session?.userId ?? "",
  };
}
