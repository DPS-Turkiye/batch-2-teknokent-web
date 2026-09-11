import "server-only";

import { UserRole } from "@/interfaces/session";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export enum MentorRequestAction {
  AcceptProposal = "accept-proposal",
  Alternatives = "alternatives",
  Availability = "availability",
  Decision = "decision",
  Messages = "messages",
  MentorMessages = "mentor-messages",
  Meeting = "meeting",
  Meetings = "meetings",
  Withdrawal = "withdrawal",
}

const ACTIONS_WITH_REQUESTER = new Set<MentorRequestAction>([
  MentorRequestAction.AcceptProposal,
  MentorRequestAction.Messages,
  MentorRequestAction.Meeting,
  MentorRequestAction.Withdrawal,
]);

export function isMentorRequestAction(
  value: string,
): value is MentorRequestAction {
  return Object.values(MentorRequestAction).includes(
    value as MentorRequestAction,
  );
}

export function fetchMentorRequests(options: {
  requesterId?: string;
  organizationId?: string;
  role?: UserRole.Mentee | UserRole.Mentor;
}) {
  return backendRequest({
    method: HttpMethod.Get,
    url: "/api/mentorship-requests",
    params:
      options.role === UserRole.Mentor
        ? { mentorId: options.requesterId }
        : { organizationId: options.organizationId },
  });
}

export function fetchMentorRequestsPage(options: {
  requesterId?: string;
  organizationId?: string;
  role?: UserRole.Mentee | UserRole.Mentor;
  tab: string;
  page: number;
  size: number;
}) {
  const scope =
    options.role === UserRole.Mentor
      ? { mentorId: options.requesterId }
      : { organizationId: options.organizationId };
  return backendRequest({
    method: HttpMethod.Get,
    url: "/api/mentorship-requests",
    params: {
      ...scope,
      tab: options.tab,
      page: options.page,
      size: options.size,
    },
  });
}

export function fetchMentorRequest(id: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: `/api/mentorship-requests/${encodeURIComponent(id)}`,
  });
}

export function createMentorRequest(
  session: { organizationId: string; userId: string },
  payload: Record<string, unknown>,
) {
  return backendRequest({
    method: HttpMethod.Post,
    url: "/api/mentorship-requests",
    data: {
      ...payload,
      requesterId: session.userId,
      organizationId: session.organizationId,
    },
  });
}

export function mutateMentorRequest(options: {
  action: MentorRequestAction;
  data?: Record<string, unknown>;
  id: string;
  method: HttpMethod;
  requesterId: string;
  mentorId?: string;
}) {
  let data = options.data;
  if (data && ACTIONS_WITH_REQUESTER.has(options.action)) {
    data = { ...data, requesterId: options.requesterId };
  }
  if (
    data &&
    (options.action === MentorRequestAction.Decision ||
      options.action === MentorRequestAction.MentorMessages)
  ) {
    data = { ...data, mentorId: options.mentorId };
  }
  return backendRequest({
    method: options.method,
    url: `/api/mentorship-requests/${encodeURIComponent(options.id)}/${options.action}`,
    data,
  });
}
