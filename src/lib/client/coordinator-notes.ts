import type { CoordinatorNote } from "@/interfaces/coordinator-note";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

const notesUrl = (mentorshipId: string) =>
  `/api/coordinator/mentorships/${encodeURIComponent(mentorshipId)}/notes`;

export async function getCoordinatorNotes(mentorshipId: string) {
  return requireSuccess(
    await backendHttp.get<CoordinatorNote[]>(notesUrl(mentorshipId)),
  );
}

export async function addCoordinatorNote(mentorshipId: string, body: string) {
  return requireSuccess(
    await backendHttp.post<CoordinatorNote>(notesUrl(mentorshipId), { body }),
  );
}

export async function deleteCoordinatorNote(id: string) {
  requireSuccess(
    await backendHttp.delete(
      `/api/coordinator/notes/${encodeURIComponent(id)}`,
    ),
  );
}
