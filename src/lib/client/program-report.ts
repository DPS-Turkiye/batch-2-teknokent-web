import type { AdminOverview } from "@/interfaces/admin-overview";
import type {
  ProgramMeetingRatings,
  ProgramSessions,
  SessionsExportFormat,
} from "@/interfaces/program-report";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

function programUrl(programId: string) {
  return `/api/coordinator/programs/${encodeURIComponent(programId)}`;
}

export async function getProgramReport(programId: string) {
  return requireSuccess(
    await httpClient.get<AdminOverview>(`${programUrl(programId)}/report`),
  );
}

export async function getProgramMeetingRatings(
  programId: string,
  from: string | null,
) {
  return requireSuccess(
    await httpClient.get<ProgramMeetingRatings>(
      `${programUrl(programId)}/meeting-ratings`,
      { params: from ? { from } : undefined },
    ),
  );
}

export async function getProgramSessions(
  programId: string,
  from: string,
  to: string,
) {
  return requireSuccess(
    await httpClient.get<ProgramSessions>(`${programUrl(programId)}/sessions`, {
      params: { from, to },
    }),
  );
}

/** A plain link: the browser downloads the file with the session cookie, no script needed. */
export function programSessionsExportHref(
  programId: string,
  range: { from: string; to: string; format: SessionsExportFormat },
) {
  return `${programUrl(programId)}/sessions/export?${new URLSearchParams(range)}`;
}
