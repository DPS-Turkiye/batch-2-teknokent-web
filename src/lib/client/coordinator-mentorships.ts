import type {
  CoordinatorMentorship,
  CoordinatorMentorshipDetail,
} from "@/interfaces/coordinator-mentorship";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

export async function getCoordinatorMentorships(programId: string | null) {
  return requireSuccess(
    await backendHttp.get<CoordinatorMentorship[]>(
      "/api/coordinator/mentorships",
      { params: programId ? { programId } : undefined },
    ),
  );
}

export async function getCoordinatorMentorship(id: string) {
  return requireSuccess(
    await backendHttp.get<CoordinatorMentorshipDetail>(
      `/api/coordinator/mentorships/${encodeURIComponent(id)}`,
    ),
  );
}

export async function remindCoordinatorMentorship(id: string) {
  requireSuccess(
    await backendHttp.post(
      `/api/coordinator/mentorships/${encodeURIComponent(id)}/remind`,
    ),
  );
}
