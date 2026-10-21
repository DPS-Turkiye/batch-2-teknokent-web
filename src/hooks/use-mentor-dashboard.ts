"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { useDecision } from "@/hooks/use-decision";
import { useMeetings } from "@/hooks/use-meetings";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { useActionItemsForRequests } from "@/hooks/use-action-items";
import type { ActionItem } from "@/interfaces/action-item";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
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
import { dayPart } from "@/lib/utils";

export function useMentorDashboard() {
  const tCommon = useTranslations("common");
  const t = useTranslations("mentorHome");
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

  const { byRequest: itemsPerMentorship, isLoading: isLoadingActionItems } =
    useActionItemsForRequests(accepted.map((request) => request.id));

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
    greeting: tCommon(`greeting.${dayPart()}`),
    nextMeeting: upcomingMeetings[0],
    todayActions: mentorTodayActions(awaitingReview, openActionItems, { t }),
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
