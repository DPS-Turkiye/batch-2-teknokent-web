"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { actionItemsQueryKey } from "@/hooks/use-action-items";
import { useMeetings } from "@/hooks/use-meetings";
import { MENTOR_PROFILE_QUERY_KEY } from "@/hooks/use-mentor-profile";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { ORGANIZATION_MEMBERS_QUERY_KEY } from "@/hooks/use-organization-members";
import { PROGRAMS_QUERY_KEY } from "@/hooks/use-programs";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { getActionItems } from "@/lib/client/action-items";
import { getMentorProfile } from "@/lib/client/mentor-profile";
import { getOrganizationMembersById } from "@/lib/client/organization-members";
import { getPrograms } from "@/lib/client/programs";
import { getOrganizationDocuments } from "@/lib/client/startup-documents";
import { MOBILE_STARTUPS } from "@/lib/mobile";
import { startupDetail } from "@/lib/mobile-startups";

export function useMobileStartup(organizationId: string) {
  const { session } = useSession();
  const [membersOpen, setMembersOpen] = useState(false);
  const requests = useMentorshipRequests(UserRole.Mentor);
  const meetings = useMeetings();
  const programs = useQuery({
    queryKey: PROGRAMS_QUERY_KEY,
    queryFn: getPrograms,
    retry: false,
  });
  const profile = useQuery({
    queryKey: MENTOR_PROFILE_QUERY_KEY,
    queryFn: getMentorProfile,
    retry: false,
  });
  const members = useQuery({
    queryKey: [...ORGANIZATION_MEMBERS_QUERY_KEY, organizationId],
    queryFn: () => getOrganizationMembersById(organizationId),
    retry: false,
  });
  const documents = useQuery({
    queryKey: ["organization-documents", organizationId],
    queryFn: () => getOrganizationDocuments(organizationId),
    retry: false,
  });
  const requestId =
    (requests.data ?? [])
      .filter(
        (request) =>
          request.organizationId === organizationId &&
          request.status === MentorshipRequestStatus.Accepted,
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]
      ?.id ?? null;
  const actionItems = useQuery({
    queryKey: actionItemsQueryKey(requestId ?? ""),
    queryFn: () => getActionItems(requestId ?? ""),
    enabled: Boolean(requestId),
  });

  const detail = useMemo(
    () =>
      startupDetail({
        organizationId,
        requests: requests.data ?? [],
        meetings: meetings.data ?? [],
        programs: programs.data ?? [],
        mentorId: session?.userId ?? "",
        members: members.data ?? [],
        documents: documents.data ?? [],
        actionItems: actionItems.data ?? [],
        frequency: profile.data?.meetingFrequency ?? null,
      }),
    [
      organizationId,
      requests.data,
      meetings.data,
      programs.data,
      session?.userId,
      members.data,
      documents.data,
      actionItems.data,
      profile.data,
    ],
  );

  return {
    backHref: MOBILE_STARTUPS,
    detail,
    isError: Boolean(requests.error),
    isLoading: requests.isLoading || meetings.isLoading,
    membersOpen,
    retry: () => void requests.refetch(),
    toggleMembers: () => setMembersOpen((open) => !open),
  };
}
