import type { StartupProcess } from "@/interfaces/startup-process";
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

function teamProcessUrl(programId: string, organizationId: string) {
  return `/api/coordinator/programs/${encodeURIComponent(programId)}/team-details/${encodeURIComponent(organizationId)}/stage`;
}

/** A coordinator's view of one program team's process, for the Takımlar drawer. */
export async function getTeamProcess(
  programId: string,
  organizationId: string,
) {
  return requireSuccess(
    await httpClient.get<StartupProcess>(
      teamProcessUrl(programId, organizationId),
    ),
  );
}
