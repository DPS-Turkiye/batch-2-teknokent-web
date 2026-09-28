import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export function fetchMentorDirectory() {
  return backendRequest({
    method: "GET",
    url: "/api/mentors",
  });
}

export function fetchMentorRating(mentorId: string) {
  return backendRequest({
    method: "GET",
    url: `/api/mentors/${encodeURIComponent(mentorId)}/rating`,
  });
}
