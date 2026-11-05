import "server-only";

import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

/** A mentee in a program gets only that program's accepted mentors. */
export function fetchMentorDirectory(actorId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: "/api/mentors",
    params: { actorId },
  });
}

export function fetchMentorRating(mentorId: string) {
  return backendRequest({
    method: "GET",
    url: `/api/mentors/${encodeURIComponent(mentorId)}/rating`,
  });
}
