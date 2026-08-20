import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export enum MentorRequestAction {
  Alternatives = "alternatives",
  Availability = "availability",
  Decision = "decision",
  Messages = "messages",
  Meeting = "meeting",
  Withdrawal = "withdrawal",
}

const ACTIONS_WITH_REQUESTER = new Set<MentorRequestAction>([
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
  role?: "mentee" | "mentor";
}) {
  return backendRequest({
    method: "GET",
    url: "/api/mentorship-requests",
    params:
      options.role === "mentor"
        ? { mentorId: options.requesterId }
        : { requesterId: options.requesterId },
  });
}

export function fetchMentorRequest(id: string) {
  return backendRequest({
    method: "GET",
    url: `/api/mentorship-requests/${encodeURIComponent(id)}`,
  });
}

export function createMentorRequest(
  session: { organizationId: string; userId: string },
  payload: Record<string, unknown>,
) {
  return backendRequest({
    method: "POST",
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
  method: "GET" | "PATCH" | "POST";
  requesterId: string;
  mentorId?: string;
}) {
  let data = options.data;
  if (data && ACTIONS_WITH_REQUESTER.has(options.action)) {
    data = { ...data, requesterId: options.requesterId };
  }
  if (data && options.action === MentorRequestAction.Decision) {
    data = { ...data, mentorId: options.mentorId };
  }
  return backendRequest({
    method: options.method,
    url: `/api/mentorship-requests/${encodeURIComponent(options.id)}/${options.action}`,
    data,
  });
}
