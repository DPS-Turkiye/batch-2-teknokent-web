import type { AttendanceRange } from "@/interfaces/program-attendance";
import { SessionsExportFormat } from "@/interfaces/program-report";

function extension(format: SessionsExportFormat) {
  return format === SessionsExportFormat.Csv ? "csv" : "xlsx";
}

/** The name the backend gives the sessions file, for when its header cannot be read. */
export function sessionsExportFilename(
  range: { from: string; to: string },
  format: SessionsExportFormat,
) {
  return `gorusmeler-${range.from}-${range.to}.${extension(format)}`;
}

/** The name the backend gives the attendance file; "tum" for the whole program. */
export function attendanceExportFilename(
  range: AttendanceRange,
  format: SessionsExportFormat,
) {
  const days = range ? `${range.from}-${range.to}` : "tum";
  return `katilim-${days}.${extension(format)}`;
}
