import { clientText } from "@/i18n/client-texts";
import {
  AttendanceErrorCode,
  type AttendanceExport,
  type AttendanceRange,
  type AttendanceSessionRef,
  type AttendanceStatus,
  type ProgramAttendanceReport,
  type ProgramAttendanceSessions,
  type SessionCheckIn,
  type SessionQr,
} from "@/interfaces/program-attendance";
import { ClientApiError, requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { downloadBackendFile } from "@/lib/client/download";
import { ATTENDANCE_TOKEN_PATTERN } from "@/lib/program-attendance";
import { attendanceExportFilename } from "@/lib/report-export";

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

/** A link that is not even a token's shape is refused here, like any dead link, without asking the backend. */
export async function checkInSession(token: string) {
  if (!ATTENDANCE_TOKEN_PATTERN.test(token)) {
    throw new ClientApiError(
      clientText("attendanceQrNotValid"),
      400,
      AttendanceErrorCode.QrNotValid,
    );
  }
  return requireSuccess(
    await backendHttp.post<SessionCheckIn>(CHECK_IN, { token }),
  );
}

export async function getProgramAttendance(
  programId: string,
  range: AttendanceRange,
) {
  return requireSuccess(
    await backendHttp.get<ProgramAttendanceReport>(reportUrl(programId), {
      params: range ?? undefined,
    }),
  );
}

/** Fetches the attendance file for the range (the whole program without one) and saves it. */
export async function downloadProgramAttendance(
  programId: string,
  { range, format }: AttendanceExport,
) {
  await downloadBackendFile(
    `${reportUrl(programId)}/export`,
    { ...range, format },
    attendanceExportFilename(range, format),
  );
}

export async function getAttendanceSessions(programId: string) {
  return requireSuccess(
    await backendHttp.get<ProgramAttendanceSessions>(
      `${reportUrl(programId)}/sessions`,
    ),
  );
}

export async function getSessionQr(
  programId: string,
  session: AttendanceSessionRef,
) {
  return requireSuccess(
    await backendHttp.post<SessionQr>(`${sessionUrl(programId, session)}/qr`),
  );
}

export async function regenerateSessionQr(
  programId: string,
  session: AttendanceSessionRef,
) {
  return requireSuccess(
    await backendHttp.post<SessionQr>(
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
    await backendHttp.put<null>(
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
    await backendHttp.delete<null>(
      `${sessionUrl(programId, session)}/participants/${encodeURIComponent(userId)}`,
    ),
  );
}
