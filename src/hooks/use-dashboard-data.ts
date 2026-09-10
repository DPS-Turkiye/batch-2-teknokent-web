"use client";

import { useEffect } from "react";

import { useSession } from "@/components/providers/session-provider";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { useMeetings } from "@/hooks/use-meetings";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import {
  DASHBOARD_FALLBACK_MEETINGS,
  DASHBOARD_FALLBACK_REQUESTS,
} from "@/lib/const";
import { requestHasConfirmedMeeting, requestHasOpenMeeting } from "@/lib/mentorship-workspace";
import { pickUpcomingMeetings } from "@/lib/upcoming-meetings";

export function useDashboardData() {
  const { session } = useSession();
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
      request.status === MentorshipRequestStatus.MoreInfoRequested ||
      request.status === MentorshipRequestStatus.CounterProposed ||
      (request.status === MentorshipRequestStatus.Accepted &&
        !requestHasConfirmedMeeting(meetings, request)),
  );
  const { nextMeeting, upcomingMeetings } = pickUpcomingMeetings(meetings);

  return {
    activeRequests,
    displayName: session?.fullName.split(" ")[0] ?? "",
    organizationName: session?.organizationName ?? "",
    isFallback: hasError,
    isLoading: meetingsQuery.isLoading || requestsQuery.isLoading,
    nextMeeting,
    pendingRequests,
    requests,
    upcomingMeetings,
  };
}
