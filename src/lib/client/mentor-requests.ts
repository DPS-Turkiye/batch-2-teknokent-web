import type { MeetingItem, MeetingStatus } from "@/interfaces/meeting";
import type {
  MentorAvailabilitySlot,
  MentorProfile,
} from "@/interfaces/mentor";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import type { PageResponse } from "@/interfaces/page-response";
import { UserRole } from "@/interfaces/session";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp, signedInUserId } from "@/lib/client/backend-http";
import type { MentorshipWorkspaceTab } from "@/types/mentorship";

const BASE = "/api/mentorship-requests";

function requestPath(id: string, action = "") {
  return `${BASE}/${encodeURIComponent(id)}${action ? `/${action}` : ""}`;
}

/** The caller's requests as a mentor, or their team's: the backend takes the team from the session. */
async function scopeOf(role: UserRole.Mentee | UserRole.Mentor | undefined) {
  return role === UserRole.Mentor ? { mentorId: await signedInUserId() } : {};
}

export async function getMentorRequests(
  role: UserRole.Mentee | UserRole.Mentor = UserRole.Mentee,
) {
  return requireSuccess(
    await backendHttp.get<MentorshipRequest[]>(BASE, {
      params: await scopeOf(role),
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
    await backendHttp.get<PageResponse<MentorshipRequest>>(BASE, {
      params: {
        ...(await scopeOf(options.role)),
        tab: options.tab,
        page: Math.max(0, options.page),
        size: Math.max(1, options.size),
      },
    }),
  );
}

export async function getMentorRequest(id: string) {
  return requireSuccess(
    await backendHttp.get<MentorshipRequest>(requestPath(id)),
  );
}

export async function replyToMentorRequest(options: {
  id: string;
  message: string;
}) {
  return requireSuccess(
    await backendHttp.post<MentorshipRequest>(
      requestPath(options.id, "messages"),
      { message: options.message },
    ),
  );
}

export async function postMentorMessage(options: {
  id: string;
  message: string;
}) {
  return requireSuccess(
    await backendHttp.post<MentorshipRequest>(
      requestPath(options.id, "mentor-messages"),
      { message: options.message },
    ),
  );
}

export async function markMentorRequestRead(id: string) {
  return requireSuccess(
    await backendHttp.post<MentorshipRequest>(requestPath(id, "read")),
  );
}

export async function withdrawMentorRequest(id: string) {
  return requireSuccess(
    await backendHttp.patch<MentorshipRequest>(requestPath(id, "withdrawal")),
  );
}

export async function getMentorAvailability(id: string) {
  return requireSuccess(
    await backendHttp.get<MentorAvailabilitySlot[]>(
      requestPath(id, "availability"),
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
    await backendHttp.post<ScheduledMeeting>(
      requestPath(options.id, "meeting"),
      { slotId: options.slotId },
    ),
  );
}

export async function getAlternativeMentors(id: string) {
  return requireSuccess(
    await backendHttp.get<MentorProfile[]>(requestPath(id, "alternatives")),
  );
}

export async function getMentorshipMeetings(id: string) {
  return requireSuccess(
    await backendHttp.get<MeetingItem[]>(requestPath(id, "meetings")),
  );
}

/** The mentor is the caller: the backend takes them from the session. */
export type LogMeetingPayload = {
  scheduledAt: string;
  durationMinutes: number;
  agenda?: string;
  notes?: string;
  outcomes?: string;
  status: MeetingStatus;
  meetLink?: string | undefined;
  transcribeRequested?: boolean;
};

export async function logMentorshipMeeting(
  id: string,
  payload: LogMeetingPayload,
) {
  return requireSuccess(
    await backendHttp.post<MeetingItem>(requestPath(id, "meetings"), payload),
  );
}

export async function decideMentorRequest(options: {
  id: string;
  message: string;
  status: MentorshipRequest["status"];
  requestedDocuments?: string[];
}) {
  return requireSuccess(
    await backendHttp.patch<MentorshipRequest>(
      requestPath(options.id, "decision"),
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
    await backendHttp.patch<MentorshipRequest>(
      requestPath(options.id, "accept-proposal"),
      { selectedSlot: options.selectedSlot },
    ),
  );
}
