"use client";

import { useEffect } from "react";

import { useSession } from "@/components/providers/session-provider";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { useMeetings } from "@/hooks/use-meetings";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";

const FALLBACK_MEETINGS: MeetingItem[] = [
  {
    id: "demo-upcoming-meeting",
    organizationId: "demo",
    mentorId: "demo-mentor",
    scheduledAt: "2026-08-12T14:00:00+03:00",
    durationMinutes: 60,
    agenda: "Kullanıcı Araştırması & Test Metodolojisi",
    status: MeetingStatus.Scheduled,
  },
];

const FALLBACK_REQUESTS: MentorshipRequest[] = [
  {
    id: "demo-pending-request",
    requesterId: "demo",
    organizationId: "demo",
    mentorId: "demo-mentor-1",
    mentorName: "Ahmet Yılmaz",
    supportArea: "Kullanıcı araştırması",
    status: MentorshipRequestStatus.Pending,
    mentorMessage: null,
    rejectionReason: null,
    createdAt: "2026-08-09T14:32:00+03:00",
    messages: [],
    recommendationSnapshot: null,
  },
  {
    id: "demo-accepted-request",
    requesterId: "demo",
    organizationId: "demo",
    mentorId: "demo-mentor-2",
    mentorName: "Can Demir",
    supportArea: "İş modeli",
    status: MentorshipRequestStatus.Accepted,
    mentorMessage: null,
    rejectionReason: null,
    createdAt: "2026-08-01T11:00:00+03:00",
    messages: [],
    recommendationSnapshot: null,
  },
];

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

  const meetings = meetingsQuery.data ?? FALLBACK_MEETINGS;
  const requests = requestsQuery.data ?? FALLBACK_REQUESTS;

  return {
    displayName: session?.fullName.split(" ")[0] ?? "Ayşe",
    organizationName: session?.organizationName ?? "NovaMed AI",
    isFallback: Boolean(meetingsQuery.error || requestsQuery.error),
    isLoading: meetingsQuery.isLoading || requestsQuery.isLoading,
    nextMeeting: meetings[0] ?? null,
    requests,
  };
}
