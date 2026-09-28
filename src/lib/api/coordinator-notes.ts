import "server-only";

import type { CoordinatorNote } from "@/interfaces/coordinator-note";
import { backendRequest } from "@/lib/server/backend-client";

const notesUrl = (mentorshipId: string) =>
  `/api/coordinator/mentorships/${encodeURIComponent(mentorshipId)}/notes`;

export function fetchCoordinatorNotes(actorId: string, mentorshipId: string) {
  return backendRequest<CoordinatorNote[]>({
    method: "GET",
    url: notesUrl(mentorshipId),
    params: { actorId },
  });
}

export function addCoordinatorNote(
  actorId: string,
  mentorshipId: string,
  body: string,
) {
  return backendRequest<CoordinatorNote>({
    method: "POST",
    url: notesUrl(mentorshipId),
    data: { actorId, body },
  });
}

export function deleteCoordinatorNote(actorId: string, id: string) {
  return backendRequest<void>({
    method: "DELETE",
    url: `/api/coordinator/notes/${encodeURIComponent(id)}`,
    params: { actorId },
  });
}
