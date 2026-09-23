"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { useSession } from "@/components/providers/session-provider";
import type { MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { useMeetings } from "@/hooks/use-meetings";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { actionItemsQueryKey } from "@/hooks/use-action-items";
import { useDismissedHomeTasks } from "@/hooks/use-dismissed-home-tasks";
import { useOpenTodoCounts } from "@/hooks/use-startup-meeting-notes";
import { getActionItems } from "@/lib/client/action-items";
import { getMeetingFeedback } from "@/lib/client/meetings";
import { isOpenActionItem } from "@/lib/mentor-dashboard";
import {
  DASHBOARD_FALLBACK_MEETINGS,
  DASHBOARD_FALLBACK_REQUESTS,
  HOME_TASK_FEEDBACK_MEETING_LIMIT,
} from "@/lib/const";
import {
  buildHomeTasks,
  requestNeedsMenteeAction,
  sentRequestState,
} from "@/lib/mentee-home";
import { dayGreeting } from "@/lib/utils";
import {
  requestHasConfirmedMeeting,
  requestHasOpenMeeting,
} from "@/lib/mentorship-workspace";
import {
  MeetingTiming,
  meetingTiming,
  visibleMeetings,
} from "@/lib/startup-meetings";
import { pickUpcomingMeetings } from "@/lib/upcoming-meetings";

const NOTE_MEETING_LIMIT = 3;

export function useDashboardData() {
  const { session } = useSession();
  const { dismissedTaskIds, dismissHomeTask } = useDismissedHomeTasks(
    session?.userId,
  );
  const meetingsQuery = useMeetings();
  const requestsQuery = useMentorshipRequests(UserRole.Mentee);

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

  const hasError = Boolean(meetingsQuery.error || requestsQuery.error);
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
  const { actionItems, actionItemRequestIds, isLoadingActionItems } =
    useQueries({
      queries: activeRequests.map((request) => ({
        queryKey: actionItemsQueryKey(request.id),
        queryFn: () => getActionItems(request.id),
      })),
      combine: (results) => {
        const requestIds: Record<string, string> = {};
        const items = results.flatMap((result, index) =>
          (result.data ?? []).map((item) => {
            requestIds[item.id] = activeRequests[index]?.id ?? "";
            return item;
          }),
        );
        return {
          actionItems: items,
          actionItemRequestIds: requestIds,
          isLoadingActionItems: results.some((result) => result.isLoading),
        };
      },
    });
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

  const heldMeetings = visibleMeetings(meetings)
    .filter((meeting) => meetingTiming(meeting) === MeetingTiming.Held)
    .sort((left, right) => right.scheduledAt.localeCompare(left.scheduledAt));
  const noteMeetings = heldMeetings.slice(0, NOTE_MEETING_LIMIT);
  const openTodoCounts = useOpenTodoCounts(
    noteMeetings.map((meeting) => meeting.id),
  );
  const feedbackCandidates = heldMeetings.slice(
    0,
    HOME_TASK_FEEDBACK_MEETING_LIMIT,
  );
  const { feedbackMeetings, isLoadingFeedback } = useQueries({
    queries: feedbackCandidates.map((meeting) => ({
      queryKey: ["meeting-feedback", meeting.id],
      queryFn: () => getMeetingFeedback(meeting.id),
    })),
    combine: (results) => ({
      feedbackMeetings: feedbackCandidates.filter((_, index) => {
        const result = results[index];
        return Boolean(result && !result.isLoading && !result.data);
      }),
      isLoadingFeedback: results.some((result) => result.isLoading),
    }),
  });

  return {
    activeRequests,
    dismissHomeTask,
    displayName: session?.fullName.split(" ")[0] ?? "",
    greeting: dayGreeting(),
    heldMeetingCount: heldMeetings.length,
    homeTasks: buildHomeTasks({
      requests,
      meetings,
      actionItems: openActionItems,
      actionItemRequestIds,
      feedbackMeetings,
      dismissedTaskIds,
    }),
    organizationName: session?.organizationName ?? "",
    isFallback: hasError,
    isLoading: meetingsQuery.isLoading || requestsQuery.isLoading,
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
