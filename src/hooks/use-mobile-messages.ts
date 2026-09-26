"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { COORDINATOR_CONVERSATIONS_QUERY_KEY } from "@/hooks/use-coordinator-messages";
import { mentorshipRequestsQueryKey } from "@/hooks/use-mentorship-requests";
import { UserRole } from "@/interfaces/session";
import { getCoordinatorConversations } from "@/lib/client/coordinator-conversations";
import { getMentorRequests } from "@/lib/client/mentor-requests";
import { hasMobileApp } from "@/lib/mobile";
import {
  type MessagingRole,
  mentorshipConversation,
  newestFirst,
  programConversation,
  searchConversations,
} from "@/lib/mobile-messages";
import { mentorshipRequestAllowsMessaging } from "@/lib/mentorship-workspace";

const POLL_MS = 15_000;

export function messagingRoleFor(role?: UserRole | null): MessagingRole {
  return role === UserRole.Mentor ? UserRole.Mentor : UserRole.Mentee;
}

/** Mentorship threads and program threads in one list, newest first. */
export function useMobileConversations() {
  const { session } = useSession();
  const enabled = hasMobileApp(session?.role);
  const role = messagingRoleFor(session?.role);
  const requests = useQuery({
    queryKey: mentorshipRequestsQueryKey(role),
    queryFn: () => getMentorRequests(role),
    enabled,
    refetchInterval: POLL_MS,
  });
  const programs = useQuery({
    queryKey: COORDINATOR_CONVERSATIONS_QUERY_KEY,
    queryFn: () => getCoordinatorConversations(),
    enabled,
    refetchInterval: POLL_MS,
  });

  const conversations = useMemo(
    () =>
      newestFirst([
        ...(requests.data ?? [])
          .filter((request) => mentorshipRequestAllowsMessaging(request.status))
          .map((request) => mentorshipConversation(request, role)),
        ...(programs.data ?? []).map((conversation) =>
          programConversation(conversation),
        ),
      ]),
    [requests.data, programs.data, role],
  );

  return {
    conversations,
    // One source failing still leaves the other's threads worth showing.
    isError: Boolean(requests.error && programs.error),
    isLoading: requests.isLoading || programs.isLoading,
    retry: () => {
      void requests.refetch();
      void programs.refetch();
    },
    unreadTotal: conversations.reduce(
      (total, conversation) => total + conversation.unreadCount,
      0,
    ),
  };
}

export function useMobileMessages() {
  const base = useMobileConversations();
  const { session } = useSession();
  const [query, setQuery] = useState("");
  const isMentor = session?.role === UserRole.Mentor;

  return {
    ...base,
    isMentor,
    searchLabel: isMentor ? "Startup veya kişi ara" : "Kişi ara",
    query,
    setQuery,
    shown: searchConversations(base.conversations, query),
  };
}
