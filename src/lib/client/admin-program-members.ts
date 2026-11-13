import type {
  ProgramMemberKind,
  ProgramTeamMove,
} from "@/interfaces/admin-overview";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function assignToProgram(
  programId: string,
  kind: ProgramMemberKind,
  targetId: string,
) {
  requireSuccess(
    await httpClient.post<void>(
      `/api/admin/programs/${encodeURIComponent(programId)}/${kind}/${encodeURIComponent(targetId)}`,
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
    await httpClient.post<ProgramTeamMove>(
      `/api/admin/programs/${encodeURIComponent(targetProgramId)}/startups/${encodeURIComponent(organizationId)}/move`,
      { fromProgramId },
    ),
  );
}
