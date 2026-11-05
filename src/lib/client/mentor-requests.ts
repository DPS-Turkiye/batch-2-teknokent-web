import type { MeetingItem, MeetingStatus } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import type { PageResponse } from "@/interfaces/page-response";
import type {
  MentorAvailabilitySlot,
  MentorProfile,
} from "@/interfaces/mentor";
import { UserRole } from "@/interfaces/session";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";
import type { MentorshipWorkspaceTab } from "@/types/mentorship";

export async function getMentorRequests(
  role: UserRole.Mentee | UserRole.Mentor = UserRole.Mentee,
) {
  return requireSuccess(
    await httpClient.get<MentorshipRequest[]>("/api/mentor-requests", {
      params: role === UserRole.Mentor ? { role } : undefined,
    }),
  );
}

export async function getMentorRequestsPage(options: {
  role?: UserRole.Mentee | UserRole.Mentor;
  tab:
    | MentorshipWorkspaceTab.Active
    | MentorshipWorkspaceTab.Requests
    | MentorshipWorkspaceTab.History;
  page: number;
  size: number;
}) {
  return requireSuccess(
    await httpClient.get<PageResponse<MentorshipRequest>>(
      "/api/mentor-requests",
      {
        params: {
          ...(options.role === UserRole.Mentor ? { role: options.role } : {}),
          tab: options.tab,
          page: options.page,
          size: options.size,
        },
      },
    ),
  );
}

export async function getMentorRequest(id: string) {
  return requireSuccess(
    await httpClient.get<MentorshipRequest>(
      `/api/mentor-requests/${encodeURIComponent(id)}`,
    ),
  );
}

export async function replyToMentorRequest(options: {
  id: string;
  message: string;
}) {
  return requireSuccess(
    await httpClient.post<MentorshipRequest>(
      `/api/mentor-requests/${encodeURIComponent(options.id)}/messages`,
      { message: options.message },
    ),
  );
}

export async function postMentorMessage(options: {
  id: string;
  message: string;
}) {
  return requireSuccess(
    await httpClient.post<MentorshipRequest>(
      `/api/mentor-requests/${encodeURIComponent(options.id)}/mentor-messages`,
      { message: options.message },
    ),
  );
}

export async function markMentorRequestRead(id: string) {
  return requireSuccess(
    await httpClient.post<MentorshipRequest>(
      `/api/mentor-requests/${encodeURIComponent(id)}/read`,
      {},
    ),
  );
}

export async function withdrawMentorRequest(id: string) {
  return requireSuccess(
    await httpClient.patch<MentorshipRequest>(
      `/api/mentor-requests/${encodeURIComponent(id)}/withdrawal`,
      {},
    ),
  );
}

export async function getMentorAvailability(id: string) {
  return requireSuccess(
    await httpClient.get<MentorAvailabilitySlot[]>(
      `/api/mentor-requests/${encodeURIComponent(id)}/availability`,
    ),
  );
}

export type ScheduledMeeting = {
  id: string;
  mentorshipRequestId: string;
  scheduledAt: string;
  durationMinutes: number;
  meetLink: string | null;
  status: string;
};

export async function scheduleMeeting(options: { id: string; slotId: string }) {
  return requireSuccess(
    await httpClient.post<ScheduledMeeting>(
      `/api/mentor-requests/${encodeURIComponent(options.id)}/meeting`,
      { slotId: options.slotId },
    ),
  );
}

export async function getAlternativeMentors(id: string) {
  return requireSuccess(
    await httpClient.get<MentorProfile[]>(
      `/api/mentor-requests/${encodeURIComponent(id)}/alternatives`,
    ),
  );
}

export async function getMentorshipMeetings(id: string) {
  return requireSuccess(
    await httpClient.get<MeetingItem[]>(
      `/api/mentor-requests/${encodeURIComponent(id)}/meetings`,
    ),
  );
}

export type LogMeetingPayload = {
  mentorId: string;
  scheduledAt: string;
  durationMinutes: number;
  agenda?: string;
  notes?: string;
  outcomes?: string;
  status: MeetingStatus;
  meetLink?: string;
  transcribeRequested?: boolean;
};

export async function logMentorshipMeeting(
  id: string,
  payload: LogMeetingPayload,
) {
  return requireSuccess(
    await httpClient.post<MeetingItem>(
      `/api/mentor-requests/${encodeURIComponent(id)}/meetings`,
      payload,
    ),
  );
}

export async function decideMentorRequest(options: {
  id: string;
  message: string;
  status: MentorshipRequest["status"];
  requestedDocuments?: string[];
}) {
  return requireSuccess(
    await httpClient.patch<MentorshipRequest>(
      `/api/mentor-requests/${encodeURIComponent(options.id)}/decision`,
      {
        status: options.status,
        message: options.message,
        requestedDocuments: options.requestedDocuments,
      },
    ),
  );
}

export async function acceptProposedMentorSlot(options: {
  id: string;
  selectedSlot: string;
}) {
  return requireSuccess(
    await httpClient.patch<MentorshipRequest>(
      `/api/mentor-requests/${encodeURIComponent(options.id)}/accept-proposal`,
      { selectedSlot: options.selectedSlot },
    ),
  );
}
