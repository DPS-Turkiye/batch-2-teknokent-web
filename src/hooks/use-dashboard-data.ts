"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";

import { useSession } from "@/components/providers/session-provider";
import {
  useActionItemsForRequests,
  useOrganizationActionItems,
} from "@/hooks/use-action-items";
import { useDismissedHomeTasks } from "@/hooks/use-dismissed-home-tasks";
import { useMyMeetingProposalsQuery } from "@/hooks/use-meeting-proposals";
import { useMeetings } from "@/hooks/use-meetings";
import { useMeetingsAwaitingFeedback } from "@/hooks/use-meetings-awaiting-feedback";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { useOpenTodoCounts } from "@/hooks/use-startup-meeting-notes";
import type { MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import {
  DASHBOARD_FALLBACK_MEETINGS,
  DASHBOARD_FALLBACK_REQUESTS,
} from "@/lib/const";
import {
  buildHomeTasks,
  requestNeedsMenteeAction,
  sentRequestState,
} from "@/lib/mentee-home";
import { isOpenActionItem } from "@/lib/mentor-dashboard";
import {
  requestHasConfirmedMeeting,
  requestHasOpenMeeting,
} from "@/lib/mentorship-workspace";
import { heldMeetingsNewestFirst } from "@/lib/startup-meetings";
import { pickUpcomingMeetings } from "@/lib/upcoming-meetings";
import { dayPart } from "@/lib/utils";

const NOTE_MEETING_LIMIT = 3;

export function useDashboardData() {
  const tCommon = useTranslations("common");
  const t = useTranslations("menteeHome");
  const locale = useLocale();
  const { session } = useSession();
  const { dismissedTaskIds, dismissHomeTask } = useDismissedHomeTasks(
    session?.userId,
  );
  const meetingsQuery = useMeetings();
  const requestsQuery = useMentorshipRequests(UserRole.Mentee);
  const proposalsQuery = useMyMeetingProposalsQuery();

  useEffect(() => {
    if (meetingsQuery.error) {
      console.error("Dashboard meetings query failed", meetingsQuery.error);
    }
    if (requestsQuery.error) {
      console.error(
        "Dashboard mentorship requests query failed",
        requestsQuery.error,
      );
    }
  }, [meetingsQuery.error, requestsQuery.error]);

  const hasError = meetingsQuery.error !== null || requestsQuery.error !== null;
  const meetings =
    meetingsQuery.data ?? (hasError ? DASHBOARD_FALLBACK_MEETINGS : []);
  const requests =
    requestsQuery.data ?? (hasError ? DASHBOARD_FALLBACK_REQUESTS : []);
  const activeRequests = requests.filter(
    (request) =>
      request.status === MentorshipRequestStatus.Accepted &&
      requestHasConfirmedMeeting(meetings, request) &&
      requestHasOpenMeeting(meetings, request),
  );
  const pendingRequests = requests.filter(
    (request) =>
      request.status === MentorshipRequestStatus.Pending ||
      requestNeedsMenteeAction(request, meetings),
  );
  const { nextMeeting, upcomingMeetings } = pickUpcomingMeetings(meetings);
  const { byRequest, isLoading: isLoadingActionItems } =
    useActionItemsForRequests(activeRequests.map((request) => request.id));
  const organizationItems = useOrganizationActionItems(session?.organizationId);
  const { actionItems, actionItemRequestIds } = useMemo(() => {
    const requestIds: Record<string, string> = {};
    const items = [...byRequest.flat()];
    const seen = new Set(items.map((item) => item.id));
    for (const item of organizationItems.data ?? []) {
      if (
        item.ownerLeftAt &&
        item.ownerId === session?.userId &&
        !seen.has(item.id)
      ) {
        items.push(item);
        seen.add(item.id);
      }
    }
    for (const item of items)
      requestIds[item.id] = item.mentorshipRequestId ?? "";
    return { actionItems: items, actionItemRequestIds: requestIds };
  }, [byRequest, organizationItems.data, session?.userId]);
  const openActionItems = useMemo(
    () =>
      actionItems
        .filter(isOpenActionItem)
        .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "")),
    [actionItems],
  );

  const openActionCountByRequest: Record<string, number> = {};
  for (const item of openActionItems) {
    const requestId = actionItemRequestIds[item.id];
    if (requestId) {
      openActionCountByRequest[requestId] =
        (openActionCountByRequest[requestId] ?? 0) + 1;
    }
  }

  const nextMeetingByRequest: Record<string, MeetingItem> = {};
  for (const meeting of upcomingMeetings) {
    const requestId = meeting.mentorshipRequestId;
    if (requestId && !nextMeetingByRequest[requestId]) {
      nextMeetingByRequest[requestId] = meeting;
    }
  }

  const requestsById: Record<string, MentorshipRequest> = {};
  for (const request of requests) requestsById[request.id] = request;

  const heldMeetings = heldMeetingsNewestFirst(meetings);
  const noteMeetings = heldMeetings.slice(0, NOTE_MEETING_LIMIT);
  const openTodoCounts = useOpenTodoCounts(
    noteMeetings.map((meeting) => meeting.id),
  );
  const { feedbackMeetings, isLoadingFeedback } =
    useMeetingsAwaitingFeedback(heldMeetings);

  return {
    activeRequests,
    dismissHomeTask,
    displayName: session?.fullName.split(" ")[0] ?? "",
    greeting: tCommon(`greeting.${dayPart()}`),
    heldMeetingCount: heldMeetings.length,
    homeTasks: buildHomeTasks({
      requests,
      meetings,
      actionItems: openActionItems,
      actionItemRequestIds,
      feedbackMeetings,
      dismissedTaskIds,
      texts: { t, locale },
    }),
    organizationName: session?.organizationName ?? "",
    isFallback: hasError,
    isLoading: meetingsQuery.isLoading || requestsQuery.isLoading,
    // The blocks above the quick actions appear only once these load; until then nothing sits
    // below them to be pushed down (layout shift).
    isLoadingTop: meetingsQuery.isLoading || proposalsQuery.isLoading,
    isLoadingFeedback,
    nextMeeting,
    nextMeetingByRequest,
    noteMeetings,
    openActionCountByRequest,
    openActionItems,
    openTodoCounts,
    isLoadingActionItems,
    otherUpcomingMeetings: upcomingMeetings.filter(
      (meeting) => meeting.id !== nextMeeting?.id,
    ),
    pendingRequests,
    requests,
    requestsById,
    sentRequests: pendingRequests.map((request) => ({
      request,
      state: sentRequestState(request, meetings),
    })),
    upcomingMeetings,
  };
}
