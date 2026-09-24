import type {
  CoordinatorMentorship,
  CoordinatorMentorshipDetail,
} from "@/interfaces/coordinator-mentorship";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getCoordinatorMentorships(programId: string | null) {
  return requireSuccess(
    await httpClient.get<CoordinatorMentorship[]>(
      "/api/coordinator/mentorships",
      { params: programId ? { programId } : undefined },
    ),
  );
}

export async function getCoordinatorMentorship(id: string) {
  return requireSuccess(
    await httpClient.get<CoordinatorMentorshipDetail>(
      `/api/coordinator/mentorships/${encodeURIComponent(id)}`,
    ),
  );
}

export async function remindCoordinatorMentorship(id: string) {
  requireSuccess(
    await httpClient.post(
      `/api/coordinator/mentorships/${encodeURIComponent(id)}/remind`,
    ),
  );
}
