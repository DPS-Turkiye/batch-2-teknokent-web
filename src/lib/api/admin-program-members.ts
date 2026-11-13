import "server-only";

import type {
  ProgramMemberKind,
  ProgramMentorRemoval,
  ProgramTeamMove,
} from "@/interfaces/admin-overview";
import { backendRequest } from "@/lib/server/backend-client";

export function assignToProgram(
  actorId: string,
  programId: string,
  kind: ProgramMemberKind,
  targetId: string,
) {
  return backendRequest<void>({
    method: "POST",
    url: `/api/admin/programs/${encodeURIComponent(programId)}/${kind}/${encodeURIComponent(targetId)}`,
    params: { actorId },
  });
}

/** Moves the startup out of `fromProgramId` into `targetProgramId`. */
export function moveStartupToProgram(
  actorId: string,
  targetProgramId: string,
  organizationId: string,
  fromProgramId: string,
) {
  return backendRequest<ProgramTeamMove>({
    method: "POST",
    url: `/api/admin/programs/${encodeURIComponent(targetProgramId)}/startups/${encodeURIComponent(organizationId)}/move`,
    params: { actorId },
    data: { fromProgramId },
  });
}

/** Takes an accepted mentor out of the program's pool. */
export function removeMentorFromProgram(
  actorId: string,
  programId: string,
  mentorId: string,
) {
  return backendRequest<ProgramMentorRemoval>({
    method: "POST",
    url: `/api/admin/programs/${encodeURIComponent(programId)}/mentors/${encodeURIComponent(mentorId)}/remove`,
    params: { actorId },
  });
}
