import "server-only";

import type { AdminOverview } from "@/interfaces/admin-overview";
import type { ProgramMeetingRatings } from "@/interfaces/program-report";
import { backendRequest } from "@/lib/server/backend-client";

function programUrl(programId: string) {
  return `/api/coordinator/programs/${encodeURIComponent(programId)}`;
}

export function fetchProgramReport(actorId: string, programId: string) {
  return backendRequest<AdminOverview>({
    method: "GET",
    url: `${programUrl(programId)}/report`,
    params: { actorId },
  });
}

export function fetchProgramMeetingRatings(
  actorId: string,
  programId: string,
  from: string | null,
) {
  return backendRequest<ProgramMeetingRatings>({
    method: "GET",
    url: `${programUrl(programId)}/meeting-ratings`,
    params: from ? { actorId, from } : { actorId },
  });
}
