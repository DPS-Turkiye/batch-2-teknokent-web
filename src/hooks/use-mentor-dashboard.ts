"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { useDecision } from "@/hooks/use-decision";
import { useMeetings } from "@/hooks/use-meetings";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { actionItemsQueryKey } from "@/hooks/use-action-items";
import type { ActionItem } from "@/interfaces/action-item";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { getActionItems } from "@/lib/client/action-items";
import {
  isOpenActionItem,
  isOverdueActionItem,
  meetingsAwaitingReview,
  mentorshipProgress,
  mentorshipTaskRatio,
  mentorTodayActions,
  mentorWeekMeetingCount,
} from "@/lib/mentor-dashboard";
import { pickUpcomingMeetings } from "@/lib/upcoming-meetings";
import { dayGreeting } from "@/lib/utils";

export function useMentorDashboard() {
  const session = useAppSession();
  const requestsQuery = useMentorshipRequests(UserRole.Mentor);
  const meetingsQuery = useMeetings();
  const decision = useDecision();
  const requests = useMemo(
    () => requestsQuery.data ?? [],
    [requestsQuery.data],
  );
  const meetings = useMemo(
    () => meetingsQuery.data ?? [],
    [meetingsQuery.data],
  );

  const accepted = useMemo(
    () =>
      requests.filter(
        (request) => request.status === MentorshipRequestStatus.Accepted,
      ),
    [requests],
  );

  // Action items are stored per mentorship, so an overview needs one query
  // per accepted mentorship. `combine` keeps the result referentially stable.
  const { itemsPerMentorship, isLoadingActionItems } = useQueries({
    queries: accepted.map((request) => ({
      queryKey: actionItemsQueryKey(request.id),
      queryFn: () => getActionItems(request.id),
    })),
    combine: (results) => ({
      itemsPerMentorship: results.map((result) => result.data ?? []),
      isLoadingActionItems: results.some((result) => result.isLoading),
    }),
  });

  const actionItemsByRequest = useMemo(() => {
    const map = new Map<string, ActionItem[]>();
    accepted.forEach((request, index) => {
      map.set(request.id, itemsPerMentorship[index] ?? []);
    });
    return map;
  }, [accepted, itemsPerMentorship]);

  const openActionItems = useMemo(
    () =>
      [...actionItemsByRequest.values()]
        .flat()
        .filter(isOpenActionItem)
        .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "")),
    [actionItemsByRequest],
  );

  const mentorships = useMemo(
    () =>
      accepted.map((request) => {
        const items = actionItemsByRequest.get(request.id) ?? [];
        return {
          request,
          actionItems: items,
          openCount: items.filter(isOpenActionItem).length,
          overdueCount: items.filter((item) => isOverdueActionItem(item))
            .length,
          progress: mentorshipProgress(items),
          ratio: mentorshipTaskRatio(items),
        };
      }),
    [accepted, actionItemsByRequest],
  );

  const awaitingReview = meetingsAwaitingReview(meetings);
  const upcomingMeetings = pickUpcomingMeetings(meetings).upcomingMeetings;

  return {
    firstName: session?.fullName?.trim().split(/\s+/)[0] || "Mentor",
    greeting: dayGreeting(),
    nextMeeting: upcomingMeetings[0],
    todayActions: mentorTodayActions(awaitingReview, openActionItems),
    pending: requests.filter(
      (request) => request.status === MentorshipRequestStatus.Pending,
    ),
    accepted,
    mentorships,
    openActionItems,
    awaitingReview,
    isLoadingActionItems,
    upcomingMeetings,
    weekMeetingCount: mentorWeekMeetingCount(meetings),
    requestsQuery,
    meetingsQuery,
    decision,
  };
}
