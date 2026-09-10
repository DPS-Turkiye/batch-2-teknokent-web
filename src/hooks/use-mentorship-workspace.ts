"use client";

import { useMemo, useState } from "react";

import { useMeetings } from "@/hooks/use-meetings";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import {
  requestHasConfirmedMeeting,
  requestHasEndedMeeting,
  requestHasOpenMeeting,
} from "@/lib/mentorship-workspace";
import { MentorshipWorkspaceTab } from "@/types/mentorship";

const requestStatuses = new Set([
  MentorshipRequestStatus.Pending,
  MentorshipRequestStatus.MoreInfoRequested,
  MentorshipRequestStatus.CounterProposed,
]);
const closedStatuses = new Set([
  MentorshipRequestStatus.Declined,
  MentorshipRequestStatus.Withdrawn,
]);

export function useMentorshipWorkspace(
  role: UserRole.Mentee | UserRole.Mentor = UserRole.Mentee,
  initialTab: MentorshipWorkspaceTab = MentorshipWorkspaceTab.Active,
) {
  const requestsQuery = useMentorshipRequests(role);
  const meetingsQuery = useMeetings();
  const [tab, setTab] = useState(initialTab);

  const meetings = useMemo(
    () => meetingsQuery.data ?? [],
    [meetingsQuery.data],
  );

  // Mentee list is org-scoped (same startup), so teammates' requests appear too.
  const allRequests = useMemo(
    () => requestsQuery.data ?? [],
    [requestsQuery.data],
  );

  const activeRequests = useMemo(
    () =>
      allRequests.filter(
        (request) =>
          request.status === MentorshipRequestStatus.Accepted &&
          requestHasConfirmedMeeting(meetings, request) &&
          requestHasOpenMeeting(meetings, request),
      ),
    [allRequests, meetings],
  );
  const pendingRequests = useMemo(
    () =>
      allRequests.filter((request) => {
        if (requestStatuses.has(request.status)) return true;
        return (
          request.status === MentorshipRequestStatus.Accepted &&
          !requestHasConfirmedMeeting(meetings, request)
        );
      }),
    [allRequests, meetings],
  );
  const historyRequests = useMemo(
    () =>
      allRequests.filter((request) => {
        if (closedStatuses.has(request.status)) return true;
        return (
          request.status === MentorshipRequestStatus.Accepted &&
          requestHasConfirmedMeeting(meetings, request) &&
          requestHasEndedMeeting(meetings, request) &&
          !requestHasOpenMeeting(meetings, request)
        );
      }),
    [allRequests, meetings],
  );

  const requests = useMemo(() => {
    if (tab === MentorshipWorkspaceTab.Active) return activeRequests;
    if (tab === MentorshipWorkspaceTab.Requests) return pendingRequests;
    if (tab === MentorshipWorkspaceTab.History) return historyRequests;
    return [];
  }, [activeRequests, historyRequests, pendingRequests, tab]);

  return {
    error: requestsQuery.error,
    historyRequests,
    isLoading: requestsQuery.isLoading || meetingsQuery.isLoading,
    meetings,
    requests,
    setTab,
    tab,
  };
}
