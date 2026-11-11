import "server-only";

import type {
  AttendanceExport,
  AttendanceRange,
  AttendanceStatus,
  ProgramAttendanceReport,
} from "@/interfaces/program-attendance";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

const MINE = "/api/programs/mine/attendance";

function reportUrl(programId: string) {
  return `/api/coordinator/programs/${encodeURIComponent(programId)}/attendance`;
}

export function fetchMyAttendance(actorId: string) {
  return backendRequest<AttendanceStatus>({
    method: HttpMethod.Get,
    url: MINE,
    params: { actorId },
  });
}

/** `week` is the week the screen showed; the backend refuses it once that week is no longer running. */
export function checkInMyAttendance(actorId: string, week: number) {
  return backendRequest<AttendanceStatus>({
    method: HttpMethod.Post,
    url: MINE,
    data: { actorId, week },
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
