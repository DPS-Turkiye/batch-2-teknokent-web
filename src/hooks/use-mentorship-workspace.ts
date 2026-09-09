"use client";

import { useMemo, useState } from "react";

import { useMeetings } from "@/hooks/use-meetings";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { MentorshipWorkspaceTab } from "@/types/mentorship";

const activeStatuses = new Set([MentorshipRequestStatus.Accepted]);
const requestStatuses = new Set([
  MentorshipRequestStatus.Pending,
  MentorshipRequestStatus.MoreInfoRequested,
]);
const historyStatuses = new Set([
  MentorshipRequestStatus.Declined,
  MentorshipRequestStatus.Withdrawn,
]);

export function useMentorshipWorkspace() {
  const requestsQuery = useMentorshipRequests(UserRole.Mentee);
  const meetingsQuery = useMeetings();
  const [tab, setTab] = useState(MentorshipWorkspaceTab.Active);

  const allRequests = useMemo(
    () => requestsQuery.data ?? [],
    [requestsQuery.data],
  );

  const activeRequests = useMemo(
    () => allRequests.filter((request) => activeStatuses.has(request.status)),
    [allRequests],
  );
  const pendingRequests = useMemo(
    () => allRequests.filter((request) => requestStatuses.has(request.status)),
    [allRequests],
  );
  const historyRequests = useMemo(
    () => allRequests.filter((request) => historyStatuses.has(request.status)),
    [allRequests],
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
    isLoading: requestsQuery.isLoading,
    meetings: meetingsQuery.data ?? [],
    requests,
    setTab,
    tab,
  };
}
