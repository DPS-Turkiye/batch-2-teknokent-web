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
