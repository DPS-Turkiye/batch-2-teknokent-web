"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { useSession } from "@/components/providers/session-provider";
import { useDashboardNotifications } from "@/hooks/use-dashboard-notifications";
import { useMeetings } from "@/hooks/use-meetings";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { PROGRAMS_QUERY_KEY } from "@/hooks/use-programs";
import { UserRole } from "@/interfaces/session";
import { getPrograms } from "@/lib/client/programs";
import {
  mentorMeetingSummary,
  mentorMessagePreviews,
  mentorStartupRows,
} from "@/lib/mobile-mentor-home";
import { pickUpcomingMeetings } from "@/lib/upcoming-meetings";

export function useMobileMentorHome() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const requests = useMentorshipRequests(UserRole.Mentor);
  const meetings = useMeetings();
  // Only names the program on each startup row; a failure just leaves it blank.
  const programs = useQuery({
    queryKey: PROGRAMS_QUERY_KEY,
    queryFn: getPrograms,
    retry: false,
  });
  const { unreadCount } = useDashboardNotifications();
  const isOnline = useOnlineStatus();

  const view = useMemo(() => {
    const allRequests = requests.data ?? [];
    const allMeetings = meetings.data ?? [];
    const next = pickUpcomingMeetings(allMeetings).nextMeeting;
    return {
      nextMeeting: next
        ? mentorMeetingSummary(next, allMeetings, allRequests)
        : null,
      startups: mentorStartupRows(
        allRequests,
        allMeetings,
        programs.data ?? [],
        session?.userId ?? "",
      ),
      messages: mentorMessagePreviews(allRequests),
    };
  }, [requests.data, meetings.data, programs.data, session?.userId]);

  return {
    ...view,
    firstName: session?.fullName.trim().split(/\s+/)[0] ?? "",
    hasUnreadNotifications: unreadCount > 0,
    isError: Boolean(requests.error || meetings.error),
    isLoading: requests.isLoading || meetings.isLoading,
    isOnline,
    retry: () => queryClient.invalidateQueries(),
  };
}
