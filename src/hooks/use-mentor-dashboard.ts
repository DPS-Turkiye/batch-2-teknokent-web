"use client";

import { useAppSession } from "@/components/providers/session-provider";
import { useDecision } from "@/hooks/use-decision";
import { useMeetings } from "@/hooks/use-meetings";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { mentorWeekMeetingCount } from "@/lib/mentor-dashboard";
import { pickUpcomingMeetings } from "@/lib/upcoming-meetings";

export function useMentorDashboard() {
  const session = useAppSession();
  const requestsQuery = useMentorshipRequests(UserRole.Mentor);
  const meetingsQuery = useMeetings();
  const decision = useDecision();
  const requests = requestsQuery.data ?? [];
  const meetings = meetingsQuery.data ?? [];
  return {
    firstName: session?.fullName?.trim().split(/\s+/)[0] || "Mentor",
    pending: requests.filter(
      (request) => request.status === MentorshipRequestStatus.Pending,
    ),
    accepted: requests.filter(
      (request) => request.status === MentorshipRequestStatus.Accepted,
    ),
    upcomingMeetings: pickUpcomingMeetings(meetings).upcomingMeetings,
    weekMeetingCount: mentorWeekMeetingCount(meetings),
    requestsQuery,
    meetingsQuery,
    decision,
  };
}
