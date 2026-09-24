import "server-only";

import type {
  CoordinatorMentorship,
  CoordinatorMentorshipDetail,
} from "@/interfaces/coordinator-mentorship";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchCoordinatorMentorships(
  actorId: string,
  programId: string | null,
) {
  return backendRequest<CoordinatorMentorship[]>({
    method: "GET",
    url: "/api/coordinator/mentorships",
    params: programId ? { actorId, programId } : { actorId },
  });
}

export function fetchCoordinatorMentorship(actorId: string, id: string) {
  return backendRequest<CoordinatorMentorshipDetail>({
    method: "GET",
    url: `/api/coordinator/mentorships/${encodeURIComponent(id)}`,
    params: { actorId },
  });
}

export function remindCoordinatorMentorship(actorId: string, id: string) {
  return backendRequest<void>({
    method: "POST",
    url: `/api/coordinator/mentorships/${encodeURIComponent(id)}/remind`,
    params: { actorId },
  });
}
