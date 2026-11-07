import "server-only";

import type { AdminOverview } from "@/interfaces/admin-overview";
import type {
  ProgramMeetingRatings,
  ProgramSessions,
  SessionsExportFormat,
} from "@/interfaces/program-report";
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

export function fetchProgramSessions(
  actorId: string,
  programId: string,
  from: string,
  to: string,
) {
  return backendRequest<ProgramSessions>({
    method: "GET",
    url: `${programUrl(programId)}/sessions`,
    params: { actorId, from, to },
  });
}

export function exportProgramSessions(
  actorId: string,
  programId: string,
  range: { from: string; to: string; format: SessionsExportFormat },
) {
  return backendRequest<ArrayBuffer>({
    method: "GET",
    url: `${programUrl(programId)}/sessions/export`,
    params: { actorId, ...range },
    responseType: "arraybuffer",
    headers: { Accept: "*/*" },
  });
}
