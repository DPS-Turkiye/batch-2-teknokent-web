import type {
  AttendanceExport,
  AttendanceRange,
  AttendanceSessionRef,
  AttendanceStatus,
  ProgramAttendanceReport,
  ProgramAttendanceSessions,
  SessionCheckIn,
  SessionQr,
} from "@/interfaces/program-attendance";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { httpClient } from "@/lib/http-client";

const MINE = "/api/programs/mine/attendance";
const CHECK_IN = "/api/attendance/check-in";

function reportUrl(programId: string) {
  return `/api/coordinator/programs/${encodeURIComponent(programId)}/attendance`;
}

function sessionUrl(programId: string, { week, kind }: AttendanceSessionRef) {
  return `${reportUrl(programId)}/sessions/${encodeURIComponent(String(week))}/${encodeURIComponent(kind)}`;
}

export async function getMyAttendance() {
  return requireSuccess(await backendHttp.get<AttendanceStatus>(MINE));
}

export async function checkInSession(token: string) {
  return requireSuccess(
    await httpClient.post<SessionCheckIn>(CHECK_IN, { token }),
  );
}

export async function getProgramAttendance(
  programId: string,
  range: AttendanceRange,
) {
  return requireSuccess(
    await httpClient.get<ProgramAttendanceReport>(reportUrl(programId), {
      params: range ?? undefined,
    }),
  );
}

/** A plain link: the browser downloads the file with the session cookie. */
export function programAttendanceExportHref(
  programId: string,
  { range, format }: AttendanceExport,
) {
  return `${reportUrl(programId)}/export?${new URLSearchParams({ ...range, format })}`;
}

export async function getAttendanceSessions(programId: string) {
  return requireSuccess(
    await httpClient.get<ProgramAttendanceSessions>(
      `${reportUrl(programId)}/sessions`,
    ),
  );
}

export async function getSessionQr(
  programId: string,
  session: AttendanceSessionRef,
) {
  return requireSuccess(
    await httpClient.post<SessionQr>(`${sessionUrl(programId, session)}/qr`),
  );
}

export async function regenerateSessionQr(
  programId: string,
  session: AttendanceSessionRef,
) {
  return requireSuccess(
    await httpClient.post<SessionQr>(
      `${sessionUrl(programId, session)}/qr/regenerate`,
    ),
  );
}

export async function markSessionAttendance(
  programId: string,
  session: AttendanceSessionRef,
  userId: string,
) {
  return requireSuccess(
    await httpClient.put<null>(
      `${sessionUrl(programId, session)}/participants/${encodeURIComponent(userId)}`,
    ),
  );
}

export async function unmarkSessionAttendance(
  programId: string,
  session: AttendanceSessionRef,
  userId: string,
) {
  return requireSuccess(
    await httpClient.delete<null>(
      `${sessionUrl(programId, session)}/participants/${encodeURIComponent(userId)}`,
    ),
  );
}
