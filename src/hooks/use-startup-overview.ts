"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useMeetings } from "@/hooks/use-meetings";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { useStartupDocuments } from "@/hooks/use-startup-documents";
import { useStartupHeader } from "@/hooks/use-startup-header";
import { STARTUP_PROFILE_QUERY_KEY } from "@/hooks/use-startup-profile";
import { UserRole } from "@/interfaces/session";
import { DocumentKind } from "@/interfaces/startup-document";
import { getStartupProfile } from "@/lib/client/organization";
import { activeMentorships } from "@/lib/startup-overview";

/** Everything the Profil tab shows, derived from live data. */
export function useStartupOverview() {
  const profileQuery = useQuery({
    queryKey: STARTUP_PROFILE_QUERY_KEY,
    queryFn: getStartupProfile,
  });
  const membersQuery = useOrganizationMembers();
  const documentsQuery = useStartupDocuments();
  const requestsQuery = useMentorshipRequests(UserRole.Mentee);
  const meetingsQuery = useMeetings();
  const header = useStartupHeader();

  // The backend lists documents newest first, so the first canvas is the latest.
  const canvas = useMemo(
    () =>
      (documentsQuery.data ?? []).find(
        (document) => document.kind === DocumentKind.Canvas,
      ) ?? null,
    [documentsQuery.data],
  );
  // Not memoized: which meeting is next depends on the clock, not only on the data.
  const mentorships = activeMentorships(
    requestsQuery.data ?? [],
    meetingsQuery.data ?? [],
    new Date(),
  );

  return {
    canvas,
    documentsLoading: documentsQuery.isLoading,
    error: profileQuery.error,
    isLoading: profileQuery.isLoading,
    mentorships,
    mentorshipsLoading: requestsQuery.isLoading || meetingsQuery.isLoading,
    profile: profileQuery.data ?? null,
    programName: header.programName,
    stageName: header.stageName,
    teamSize: membersQuery.data?.length ?? null,
  };
}
