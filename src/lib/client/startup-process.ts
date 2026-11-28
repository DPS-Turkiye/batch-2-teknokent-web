import type { StartupProcess } from "@/interfaces/startup-process";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { getProgramTeamDetail } from "@/lib/client/coordinator-programs";
import { httpClient } from "@/lib/http-client";

export async function getStartupProcess() {
  return requireSuccess(
    await httpClient.get<StartupProcess>("/api/startup/process"),
  );
}

/** Hands an Ödev in: with the uploaded file, or with null for a program Ödev that asks for no file. */
export async function submitAssignment(
  assignmentId: string,
  documentId: string | null,
) {
  return requireSuccess(
    await httpClient.put<StartupProcess>(
      `/api/startup/process/assignments/${encodeURIComponent(assignmentId)}/submission`,
      { documentId },
    ),
  );
}

/** "Kaldır": takes a handed-in file back while it could still be replaced; the Ödev is open again. */
export async function withdrawSubmission(assignmentId: string) {
  return requireSuccess(
    await httpClient.delete<StartupProcess>(
      `/api/startup/process/assignments/${encodeURIComponent(assignmentId)}/submission`,
    ),
  );
}

/**
 * A coordinator's view of one program team's process, for the Takımlar drawer. The drawer is for this program's
 * teams, so the team is looked up in the program first and one outside it answers that lookup's refusal. Who may
 * read a process at all is the backend's decision on the process endpoint.
 */
export async function getTeamProcess(
  programId: string,
  organizationId: string,
) {
  await getProgramTeamDetail(programId, organizationId);
  return requireSuccess(
    await backendHttp.get<StartupProcess>(
      `/api/organizations/${encodeURIComponent(organizationId)}/process`,
    ),
  );
}
