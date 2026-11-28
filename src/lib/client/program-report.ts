import type { AdminOverview } from "@/interfaces/admin-overview";
import type { PageResponse } from "@/interfaces/page-response";
import type {
  ProgramMeetingFeedback,
  ProgramMeetingRatings,
  ProgramSessions,
  SessionsExportFormat,
} from "@/interfaces/program-report";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { downloadBackendFile } from "@/lib/client/download";
import { sessionsExportFilename } from "@/lib/report-export";

/** Meeting feedback rows a page, as the screen always showed them; the backend caps the size too. */
const MEETING_FEEDBACK_PAGE_SIZE = 20;

function programUrl(programId: string) {
  return `/api/coordinator/programs/${encodeURIComponent(programId)}`;
}

export async function getProgramReport(programId: string) {
  return requireSuccess(
    await backendHttp.get<AdminOverview>(`${programUrl(programId)}/report`),
  );
}

export async function getProgramMeetingRatings(
  programId: string,
  from: string | null,
) {
  return requireSuccess(
    await backendHttp.get<ProgramMeetingRatings>(
      `${programUrl(programId)}/meeting-ratings`,
      { params: from ? { from } : undefined },
    ),
  );
}

export async function getProgramMeetingFeedback(
  programId: string,
  query: { from: string | null; page: number },
) {
  return requireSuccess(
    await backendHttp.get<PageResponse<ProgramMeetingFeedback>>(
      `${programUrl(programId)}/meeting-feedback`,
      {
        params: query.from
          ? {
              from: query.from,
              page: query.page,
              size: MEETING_FEEDBACK_PAGE_SIZE,
            }
          : { page: query.page, size: MEETING_FEEDBACK_PAGE_SIZE },
      },
    ),
  );
}

export async function getProgramSessions(
  programId: string,
  from: string,
  to: string,
) {
  return requireSuccess(
    await backendHttp.get<ProgramSessions>(
      `${programUrl(programId)}/sessions`,
      {
        params: { from, to },
      },
    ),
  );
}

/** Fetches the sessions file for the range and saves it. */
export async function downloadProgramSessions(
  programId: string,
  range: { from: string; to: string; format: SessionsExportFormat },
) {
  await downloadBackendFile(
    `${programUrl(programId)}/sessions/export`,
    range,
    sessionsExportFilename(range, range.format),
  );
}
