import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchMentorProfile(mentorId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: `/api/mentors/${encodeURIComponent(mentorId)}`,
  });
}

export function fetchMentorAvailability(mentorId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: `/api/mentors/${encodeURIComponent(mentorId)}/availability`,
  });
}
