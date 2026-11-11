"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { mentorshipRequestsQueryKey } from "@/hooks/use-mentorship-requests";
import { MENTOR_REGULAR_MENTORSHIPS_QUERY_KEY } from "@/hooks/use-mobile-startups";
import { UserRole } from "@/interfaces/session";
import { getMentorRequests } from "@/lib/client/mentor-requests";
import { getRegularMentorships } from "@/lib/client/mentorships";
import {
  canOpenMemberProfile,
  mentorLinkedStartupIds,
} from "@/lib/member-profile-links";
import { hasPermission } from "@/lib/permissions";

/**
 * Whether a startup member's name should link to their profile page for the signed-in user. A mentor's
 * requests and mentorships decide it for them; both lists are already cached by the mentor's own screens.
 */
export function useMemberProfileLinks() {
  const session = useAppSession();
  const isMentor = hasPermission(session, UserRole.Mentor);
  const requests = useQuery({
    queryKey: mentorshipRequestsQueryKey(UserRole.Mentor),
    queryFn: () => getMentorRequests(UserRole.Mentor),
    enabled: isMentor,
  });
  const mentorships = useQuery({
    queryKey: MENTOR_REGULAR_MENTORSHIPS_QUERY_KEY,
    queryFn: () => getRegularMentorships(UserRole.Mentor),
    enabled: isMentor,
  });
  const mentorStartupIds = useMemo(
    () => mentorLinkedStartupIds(requests.data ?? [], mentorships.data ?? []),
    [requests.data, mentorships.data],
  );

  return useCallback(
    (organizationId: string) =>
      session !== null &&
      canOpenMemberProfile(session, organizationId, mentorStartupIds),
    [session, mentorStartupIds],
  );
}
