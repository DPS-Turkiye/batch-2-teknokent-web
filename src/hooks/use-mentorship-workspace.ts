"use client";

import { useMemo, useState } from "react";

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
  const [tab, setTab] = useState(MentorshipWorkspaceTab.Active);
  const [query, setQuery] = useState("");

  const requests = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
    return (requestsQuery.data ?? []).filter((request) => {
      const matchesQuery =
        !normalizedQuery ||
        (request.mentorName + " " + request.supportArea)
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedQuery);
      if (!matchesQuery) return false;
      if (tab === MentorshipWorkspaceTab.Active)
        return activeStatuses.has(request.status);
      if (tab === MentorshipWorkspaceTab.Requests)
        return requestStatuses.has(request.status);
      if (tab === MentorshipWorkspaceTab.History)
        return historyStatuses.has(request.status);
      return false;
    });
  }, [query, requestsQuery.data, tab]);

  return {
    error: requestsQuery.error,
    isLoading: requestsQuery.isLoading,
    query,
    requests,
    setQuery,
    setTab,
    tab,
    totalRequests: requestsQuery.data?.length ?? 0,
  };
}
