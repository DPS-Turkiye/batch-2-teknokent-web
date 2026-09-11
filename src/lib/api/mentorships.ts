import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchRegularMentorships(options: {
  mentorId?: string;
  organizationId?: string;
}) {
  return backendRequest({
    method: HttpMethod.Get,
    url: "/api/mentorships",
    params: {
      activeOnly: true,
      ...(options.mentorId ? { mentorId: options.mentorId } : {}),
      ...(options.organizationId
        ? { organizationId: options.organizationId }
        : {}),
    },
  });
}

export function fetchRegularMentorship(id: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: `/api/mentorships/${encodeURIComponent(id)}`,
  });
}

export function createRegularMentorship(payload: {
  mentorId: string;
  organizationId: string;
  status: string;
  startDate: string;
  endDate: string;
  daysPerWeek: number;
}) {
  return backendRequest({
    method: HttpMethod.Post,
    url: "/api/mentorships",
    data: payload,
  });
}

export function updateRegularMentorship(options: {
  mentorshipId: string;
  actorId: string;
  startDate: string;
  endDate: string | null;
  daysPerWeek: number;
}) {
  return backendRequest({
    method: HttpMethod.Patch,
    url: `/api/mentorships/${encodeURIComponent(options.mentorshipId)}`,
    params: { actorId: options.actorId },
    data: {
      startDate: options.startDate,
      endDate: options.endDate,
      daysPerWeek: options.daysPerWeek,
    },
  });
}

export function deleteRegularMentorship(options: {
  mentorshipId: string;
  actorId: string;
}) {
  return backendRequest({
    method: HttpMethod.Delete,
    url: `/api/mentorships/${encodeURIComponent(options.mentorshipId)}`,
    params: { actorId: options.actorId },
  });
}

export function createMentorshipGoal(options: {
  mentorshipId: string;
  actorId: string;
  title: string;
}) {
  return backendRequest({
    method: HttpMethod.Post,
    url: `/api/mentorships/${encodeURIComponent(options.mentorshipId)}/goals`,
    params: { actorId: options.actorId },
    data: { title: options.title },
  });
}

export function updateMentorshipGoal(options: {
  mentorshipId: string;
  goalId: string;
  actorId: string;
  done: boolean;
}) {
  return backendRequest({
    method: HttpMethod.Patch,
    url: `/api/mentorships/${encodeURIComponent(options.mentorshipId)}/goals/${encodeURIComponent(options.goalId)}`,
    params: { actorId: options.actorId },
    data: { done: options.done },
  });
}

export function fetchMentorshipWeekChecks(options: {
  mentorId: string;
  weekStart: string;
}) {
  return backendRequest({
    method: HttpMethod.Get,
    url: "/api/mentorships/week-checks",
    params: {
      mentorId: options.mentorId,
      weekStart: options.weekStart,
    },
  });
}

export function upsertMentorshipWeekCheck(options: {
  mentorshipId: string;
  actorId: string;
  weekStart: string;
  completed: boolean;
}) {
  return backendRequest({
    method: HttpMethod.Put,
    url: `/api/mentorships/${encodeURIComponent(options.mentorshipId)}/week-checks`,
    params: { actorId: options.actorId },
    data: {
      weekStart: options.weekStart,
      completed: options.completed,
    },
  });
}

export function fetchOrganizationsDirectory() {
  return backendRequest({
    method: HttpMethod.Get,
    url: "/api/organizations",
  });
}
