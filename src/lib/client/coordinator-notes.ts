import type { CoordinatorNote } from "@/interfaces/coordinator-note";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

const notesUrl = (mentorshipId: string) =>
  `/api/coordinator/mentorships/${encodeURIComponent(mentorshipId)}/notes`;

export async function getCoordinatorNotes(mentorshipId: string) {
  return requireSuccess(
    await httpClient.get<CoordinatorNote[]>(notesUrl(mentorshipId)),
  );
}

export async function addCoordinatorNote(mentorshipId: string, body: string) {
  return requireSuccess(
    await httpClient.post<CoordinatorNote>(notesUrl(mentorshipId), { body }),
  );
}

export async function deleteCoordinatorNote(id: string) {
  requireSuccess(
    await httpClient.delete(`/api/coordinator/notes/${encodeURIComponent(id)}`),
  );
}
