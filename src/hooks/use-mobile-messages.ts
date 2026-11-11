"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { COORDINATOR_CONVERSATIONS_QUERY_KEY } from "@/hooks/use-coordinator-messages";
import { mentorshipRequestsQueryKey } from "@/hooks/use-mentorship-requests";
import { useMobileTexts } from "@/hooks/use-mobile-texts";
import { ANNOUNCEMENTS_QUERY_KEY } from "@/hooks/use-program-announcements";
import { UserRole } from "@/interfaces/session";
import { getCoordinatorConversations } from "@/lib/client/coordinator-conversations";
import { getMentorRequests } from "@/lib/client/mentor-requests";
import { getMyAnnouncements } from "@/lib/client/program-announcements";
import { hasMobileApp } from "@/lib/mobile";
import {
  announcementConversation,
  groupedMentorshipConversations,
  newestFirst,
  programConversation,
  searchConversations,
  type MessagingRole,
} from "@/lib/mobile-messages";
import { POLL_INTERVAL, polling } from "@/lib/poll";
import { announcementThreads } from "@/lib/program-announcements";

export function messagingRoleFor(role?: UserRole | null): MessagingRole {
  return role === UserRole.Mentor ? UserRole.Mentor : UserRole.Mentee;
}

/** Mentorship threads and program threads in one list, newest first. */
export function useMobileConversations() {
  const { session } = useSession();
  const enabled = hasMobileApp(session?.role);
  const role = messagingRoleFor(session?.role);
  const texts = useMobileTexts();
  const requests = useQuery({
    queryKey: mentorshipRequestsQueryKey(role),
    queryFn: () => getMentorRequests(role),
    enabled,
    ...polling(POLL_INTERVAL.messages),
  });
  const programs = useQuery({
    queryKey: COORDINATOR_CONVERSATIONS_QUERY_KEY,
    queryFn: () => getCoordinatorConversations(),
    enabled,
    ...polling(POLL_INTERVAL.messages),
  });

  const announcements = useQuery({
    queryKey: [...ANNOUNCEMENTS_QUERY_KEY, "mine"],
    queryFn: getMyAnnouncements,
    enabled,
    ...polling(POLL_INTERVAL.messages),
  });

  const conversations = useMemo(
    () =>
      newestFirst([
        ...groupedMentorshipConversations(requests.data ?? [], role, texts),
        ...(programs.data ?? []).map((conversation) =>
          programConversation(conversation, texts),
        ),
        ...announcementThreads(announcements.data ?? []).map((thread) =>
          announcementConversation(thread, texts),
        ),
      ]),
    [requests.data, programs.data, announcements.data, role, texts],
  );

  return {
    conversations,
    // One source failing still leaves the other's threads worth showing.
    isError: Boolean(requests.error && programs.error),
    isLoading: requests.isLoading || programs.isLoading,
    retry: () => {
      void requests.refetch();
      void programs.refetch();
      void announcements.refetch();
    },
    unreadTotal: conversations.reduce(
      (total, conversation) => total + conversation.unreadCount,
      0,
    ),
  };
}

export function useMobileMessages() {
  const base = useMobileConversations();
  const { t, locale } = useMobileTexts();
  const { session } = useSession();
  const [query, setQuery] = useState("");
  const isMentor = session?.role === UserRole.Mentor;

  return {
    ...base,
    isMentor,
    searchLabel: isMentor
      ? t("messages.searchMentor")
      : t("messages.searchMentee"),
    query,
    setQuery,
    shown: searchConversations(base.conversations, query, locale),
  };
}
