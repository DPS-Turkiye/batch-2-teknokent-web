import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export function fetchMentorAvailability(mentorId: string) {
  return backendRequest({
    method: "GET",
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability`,
  });
}

export function createMentorAvailability(
  mentorId: string,
  data: { startsAt: string; durationMinutes?: number },
) {
  return backendRequest({
    method: "POST",
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability`,
    data,
  });
}

export function deleteMentorAvailability(mentorId: string, slotId: string) {
  return backendRequest({
    method: "DELETE",
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability/${encodeURIComponent(slotId)}`,
  });
}
