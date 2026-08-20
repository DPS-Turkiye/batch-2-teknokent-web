import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchMentorAvailability(mentorId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability`,
  });
}

export function createMentorAvailability(
  mentorId: string,
  data: { startsAt: string; durationMinutes?: number },
) {
  return backendRequest({
    method: HttpMethod.Post,
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability`,
    data,
  });
}

export function deleteMentorAvailability(mentorId: string, slotId: string) {
  return backendRequest({
    method: HttpMethod.Delete,
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability/${encodeURIComponent(slotId)}`,
  });
}
