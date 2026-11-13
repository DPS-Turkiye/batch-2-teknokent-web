import { PeerReportStatus } from "@/interfaces/peer-reports";
import { addDays, isoDay, startOfWeek } from "@/lib/coordinator-calendar";
import { PeerReportBadge } from "@/types/peer-reports";

/** A report week is Monday to Friday: the working days a daily report is due on. */
export const REPORT_WORKING_DAYS = 5;

const MINUTES_PER_HOUR = 60;

const BADGE_OF_STATUS: Record<PeerReportStatus, PeerReportBadge> = {
  [PeerReportStatus.Draft]: PeerReportBadge.Draft,
  [PeerReportStatus.InReview]: PeerReportBadge.InReview,
  [PeerReportStatus.Approved]: PeerReportBadge.Approved,
  [PeerReportStatus.RevisionRequested]: PeerReportBadge.RevisionRequested,
};

/**
 * The pill for a report: "Eksik Bilgi" while a held meeting still lacks its report and the report can still change,
 * else its stored status. Null for a report nobody started (the screens say "Henüz başlamadı" there).
 */
export function peerReportBadge(
  status: PeerReportStatus | null,
  missingMeetingReports = 0,
): PeerReportBadge | null {
  if (isPeerReportEditable(status) && missingMeetingReports > 0)
    return PeerReportBadge.MissingInfo;
  return status === null ? null : BADGE_OF_STATUS[status];
}

/** Whether a report still takes changes from its mentor; prefer a response's own `editable` where it has one. */
export function isPeerReportEditable(status: PeerReportStatus | null) {
  return (
    status === null ||
    status === PeerReportStatus.Draft ||
    status === PeerReportStatus.RevisionRequested
  );
}

/**
 * The Monday ("yyyy-mm-dd") of the week a moment falls in, in the runtime's time zone. Call it in the browser: on
 * the server (UTC) a Turkish Monday before 03:00 would still be last week.
 */
export function reportWeekStart(now: Date) {
  return isoDay(startOfWeek(now));
}

/** Another week's Monday, `weeks` before (negative) or after this one. */
export function shiftReportWeek(weekStart: string, weeks: number) {
  return isoDay(addDays(fromIsoDay(weekStart), weeks * 7));
}

/** The working days of a report week, Monday to Friday. */
export function reportWeekDays(weekStart: string) {
  const monday = fromIsoDay(weekStart);
  return Array.from({ length: REPORT_WORKING_DAYS }, (_, offset) =>
    isoDay(addDays(monday, offset)),
  );
}

/** Minutes as hours and minutes, for "2 sa 45 dk". */
export function splitMinutes(total: number) {
  const minutes = Math.max(0, Math.round(total));
  return {
    hours: Math.floor(minutes / MINUTES_PER_HOUR),
    minutes: minutes % MINUTES_PER_HOUR,
  };
}

/** Local midnight of a "yyyy-mm-dd" day (not UTC midnight, which `new Date("yyyy-mm-dd")` would give). */
export function fromIsoDay(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, date ?? 1);
}

/** The day's view in "Faaliyet Raporum" for a moment (the meeting report's way back), in the browser's time zone. */
export function dailyReportHref(at: string) {
  const day = isoDay(new Date(at));
  return `/student/peer-mentoring?tab=report&view=daily&day=${day}`;
}

/** A meeting's report page (Görüşme Raporu), read-only once it is sent. */
export function meetingReportHref(meetingId: string) {
  return `/student/peer-mentoring/reports/meetings/${encodeURIComponent(meetingId)}`;
}
