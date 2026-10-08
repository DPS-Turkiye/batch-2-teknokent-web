import type {
  StartupProcess,
  StartupStage,
} from "@/interfaces/startup-process";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getStartupProcess() {
  return requireSuccess(
    await httpClient.get<StartupProcess>("/api/startup/process"),
  );
}

export async function submitAssignment(
  assignmentId: string,
  documentId: string,
) {
  return requireSuccess(
    await httpClient.put<StartupProcess>(
      `/api/startup/process/assignments/${encodeURIComponent(assignmentId)}/submission`,
      { documentId },
    ),
  );
}

function teamStageUrl(programId: string, organizationId: string) {
  return `/api/coordinator/programs/${encodeURIComponent(programId)}/team-details/${encodeURIComponent(organizationId)}/stage`;
}

/** A coordinator's view of one program team's process, for the Takımlar drawer. */
export async function getTeamProcess(
  programId: string,
  organizationId: string,
) {
  return requireSuccess(
    await httpClient.get<StartupProcess>(
      teamStageUrl(programId, organizationId),
    ),
  );
}

export async function updateTeamStage(
  programId: string,
  organizationId: string,
  stage: StartupStage,
) {
  return requireSuccess(
    await httpClient.put<StartupProcess>(
      teamStageUrl(programId, organizationId),
      { stage },
    ),
  );
}
