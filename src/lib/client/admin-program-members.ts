import type {
  ProgramMemberKind,
  ProgramMentorRemoval,
  ProgramTeamMove,
} from "@/interfaces/admin-overview";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

function programPath(programId: string) {
  return `/api/admin/programs/${encodeURIComponent(programId)}`;
}

export async function assignToProgram(
  programId: string,
  kind: ProgramMemberKind,
  targetId: string,
) {
  requireSuccess(
    await backendHttp.post<void>(
      `${programPath(programId)}/${kind}/${encodeURIComponent(targetId)}`,
    ),
  );
}

/** Moves the startup out of `fromProgramId` into `targetProgramId`. */
export async function moveStartupToProgram(
  targetProgramId: string,
  organizationId: string,
  fromProgramId: string,
) {
  return requireSuccess(
    await backendHttp.post<ProgramTeamMove>(
      `${programPath(targetProgramId)}/startups/${encodeURIComponent(organizationId)}/move`,
      { fromProgramId },
    ),
  );
}

/** Takes an accepted mentor out of the program's pool. */
export async function removeMentorFromProgram(
  programId: string,
  mentorId: string,
) {
  return requireSuccess(
    await backendHttp.post<ProgramMentorRemoval>(
      `${programPath(programId)}/mentors/${encodeURIComponent(mentorId)}/remove`,
    ),
  );
}
