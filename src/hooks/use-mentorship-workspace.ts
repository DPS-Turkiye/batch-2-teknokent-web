"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useMeetings } from "@/hooks/use-meetings";
import type { UserRole } from "@/interfaces/session";
import { getMentorRequestsPage } from "@/lib/client/mentor-requests";
import { MENTORSHIP_LIST_PAGE_SIZE } from "@/lib/const";
import { MentorshipWorkspaceTab } from "@/types/mentorship";

export type MentorshipListTab =
  | MentorshipWorkspaceTab.Active
  | MentorshipWorkspaceTab.Requests
  | MentorshipWorkspaceTab.History;

export const mentorshipRequestsPageQueryKey = (
  role: UserRole.Mentee | UserRole.Mentor,
  tab: MentorshipListTab,
  page: number,
  size: number,
) => ["mentorship-requests", role, tab, page, size] as const;

export function useMentorshipWorkspace(
  initialTab: MentorshipWorkspaceTab = MentorshipWorkspaceTab.Active,
) {
  const meetingsQuery = useMeetings();
  const [tab, setTab] = useState(initialTab);

  const meetings = useMemo(
    () => meetingsQuery.data ?? [],
    [meetingsQuery.data],
  );

  return {
    meetings,
    meetingsError: meetingsQuery.error,
    meetingsLoading: meetingsQuery.isLoading,
    setTab,
    tab,
  };
}

export function useMentorshipRequestsPage(
  role: UserRole.Mentee | UserRole.Mentor,
  tab: MentorshipListTab,
  uiPage: number,
  size: number = MENTORSHIP_LIST_PAGE_SIZE,
) {
  const apiPage = Math.max(0, uiPage - 1);
  const query = useQuery({
    queryKey: mentorshipRequestsPageQueryKey(role, tab, apiPage, size),
    queryFn: () =>
      getMentorRequestsPage({
        role,
        tab,
        page: apiPage,
        size,
      }),
  });

  return {
    error: query.error,
    isLoading: query.isLoading,
    page: uiPage,
    requests: query.data?.content ?? [],
    totalElements: query.data?.totalElements ?? 0,
    totalPages: Math.max(1, query.data?.totalPages ?? 1),
  };
}
