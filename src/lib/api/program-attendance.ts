import "server-only";

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
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

const MINE = "/api/programs/mine/attendance";
const CHECK_IN = "/api/attendance/check-in";

function reportUrl(programId: string) {
  return `/api/coordinator/programs/${encodeURIComponent(programId)}/attendance`;
}

function sessionUrl(programId: string, { week, kind }: AttendanceSessionRef) {
  return `${reportUrl(programId)}/sessions/${encodeURIComponent(String(week))}/${encodeURIComponent(kind)}`;
}

export function fetchMyAttendance(actorId: string) {
  return backendRequest<AttendanceStatus>({
    method: HttpMethod.Get,
    url: MINE,
    params: { actorId },
  });
}

/** The token travels in the body, so it stays out of the backend's request logs. */
export function checkInSession(actorId: string, token: string) {
  return backendRequest<SessionCheckIn>({
    method: HttpMethod.Post,
    url: CHECK_IN,
    data: { actorId, token },
  });
}

export function fetchProgramAttendance(
  actorId: string,
  programId: string,
  range: AttendanceRange,
) {
  return backendRequest<ProgramAttendanceReport>({
    method: HttpMethod.Get,
    url: reportUrl(programId),
    params: { actorId, ...range },
  });
}

export function exportProgramAttendance(
  actorId: string,
  programId: string,
  { range, format }: AttendanceExport,
) {
  return backendRequest<ArrayBuffer>({
    method: HttpMethod.Get,
    url: `${reportUrl(programId)}/export`,
    params: { actorId, ...range, format },
    responseType: "arraybuffer",
    headers: { Accept: "*/*" },
  });
}

export function fetchAttendanceSessions(actorId: string, programId: string) {
  return backendRequest<ProgramAttendanceSessions>({
    method: HttpMethod.Get,
    url: `${reportUrl(programId)}/sessions`,
    params: { actorId },
  });
}

/** The session's QR code; the backend makes it the first time it is asked for. */
export function fetchSessionQr(
  actorId: string,
  programId: string,
  session: AttendanceSessionRef,
) {
  return backendRequest<SessionQr>({
    method: HttpMethod.Post,
    url: `${sessionUrl(programId, session)}/qr`,
    params: { actorId },
  });
}

/** A new code for the session; the old link stops working. */
export function regenerateSessionQr(
  actorId: string,
  programId: string,
  session: AttendanceSessionRef,
) {
  return backendRequest<SessionQr>({
    method: HttpMethod.Post,
    url: `${sessionUrl(programId, session)}/qr/regenerate`,
    params: { actorId },
  });
}

export function markSessionAttendance(
  actorId: string,
  programId: string,
  session: AttendanceSessionRef,
  userId: string,
) {
  return backendRequest<null>({
    method: HttpMethod.Put,
    url: `${sessionUrl(programId, session)}/participants/${encodeURIComponent(userId)}`,
    params: { actorId },
  });
}

export function unmarkSessionAttendance(
  actorId: string,
  programId: string,
  session: AttendanceSessionRef,
  userId: string,
) {
  return backendRequest<null>({
    method: HttpMethod.Delete,
    url: `${sessionUrl(programId, session)}/participants/${encodeURIComponent(userId)}`,
    params: { actorId },
  });
}
