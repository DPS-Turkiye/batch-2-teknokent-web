import type {
  AttendanceExport,
  AttendanceRange,
  AttendanceStatus,
  ProgramAttendanceReport,
} from "@/interfaces/program-attendance";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

const MINE = "/api/programs/mine/attendance";

function reportUrl(programId: string) {
  return `/api/coordinator/programs/${encodeURIComponent(programId)}/attendance`;
}

export async function getMyAttendance() {
  return requireSuccess(await httpClient.get<AttendanceStatus>(MINE));
}

export async function checkInMyAttendance(week: number) {
  return requireSuccess(
    await httpClient.post<AttendanceStatus>(MINE, { week }),
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
