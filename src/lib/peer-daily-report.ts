import {
  PeerActivityType,
  PeerReportStatus,
  type PeerDailyReport,
  type PeerReportDay,
  type PeerReportMeeting,
  type SavePeerActivityInput,
  type SavePeerDailyReportInput,
} from "@/interfaces/peer-reports";
import { addDays, isoDay } from "@/lib/coordinator-calendar";
import { isEnumValue } from "@/lib/enum";
import {
  fromIsoDay,
  REPORT_TIME_ZONE,
  reportWeekDays,
  reportWeekStart,
} from "@/lib/peer-reports";
import { weeklyDayCards } from "@/lib/peer-weekly-report";
import { ISO_DAY_PATTERN } from "@/lib/utils";
import type {
  ActivityForm,
  DailyReportForm,
  ReportDayCard,
  ReportSearch,
} from "@/types/peer-daily-report";
import { PeerReportBadge, PeerReportView } from "@/types/peer-reports";

export const DAILY_TEXT_MAX = 4000;
export const ACTIVITY_TITLE_MAX = 200;
export const ACTIVITY_DESCRIPTION_MAX = 2000;
export const ACTIVITY_MINUTES_MAX = 720;

/** The four written answers the backend requires, plus the skills, make "Günlük değerlendirme · n / 5". */
export const DAILY_EVALUATION_PARTS = 5;

/**
 * The form from the day's report. A day never saved starts with the skills its meeting reports used ("Görüşme
 * raporlarındaki seçimlerinden otomatik işaretlendi").
 */
export function dailyReportForm(report: PeerDailyReport): DailyReportForm {
  return {
    didToday: report.didToday ?? "",
    challenge: report.challenge ?? "",
    skills:
      report.id === null ? [...report.suggestedSkills] : [...report.skills],
    learned: report.learned ?? "",
    tomorrowPlan: report.tomorrowPlan ?? "",
  };
}

export function dailyReportInput(
  form: DailyReportForm,
): SavePeerDailyReportInput {
  return {
    didToday: textOrNull(form.didToday),
    challenge: textOrNull(form.challenge),
    skills: form.skills,
    learned: textOrNull(form.learned),
    tomorrowPlan: textOrNull(form.tomorrowPlan),
  };
}

/** How many of the five evaluation parts are answered. */
export function answeredDailyParts(form: DailyReportForm): number {
  return (
    [form.didToday, form.challenge, form.learned, form.tomorrowPlan].filter(
      (answer) => answer.trim() !== "",
    ).length + (form.skills.length > 0 ? 1 : 0)
  );
}

/** The backend's rule for sending a day: its four written answers, and every held meeting's report sent. */
export function dailyReportReady(
  report: PeerDailyReport,
  form: DailyReportForm,
): boolean {
  return (
    report.editable &&
    report.missingMeetingReports === 0 &&
    [form.didToday, form.challenge, form.learned, form.tomorrowPlan].every(
      (answer) => answer.trim() !== "",
    )
  );
}

/** A meeting row's state: "Tamamlandı" once its report is sent, "Çıktı Bekliyor" before. */
export function meetingRowBadge(meeting: PeerReportMeeting): PeerReportBadge {
  return meeting.reportStatus === PeerReportStatus.InReview ||
    meeting.reportStatus === PeerReportStatus.Approved
    ? PeerReportBadge.Completed
    : PeerReportBadge.AwaitingOutput;
}

/** The week's five day cards (badges as the weekly view counts them), with the chosen day and today marked. */
export function reportDayCards(
  weekStart: string,
  days: readonly PeerReportDay[],
  selected: string,
  today: string,
): ReportDayCard[] {
  const known = weeklyDayCards(days);
  return reportWeekDays(weekStart).map((date) => ({
    date,
    badge: known.find((card) => card.date === date)?.badge ?? null,
    isToday: date === today,
    isSelected: date === selected,
    isFuture: date > today,
  }));
}

/** "9–13 Kasım 2026" (or "30 Kasım – 4 Aralık 2026" across months). */
export function reportWeekLabel(weekStart: string, locale: string): string {
  const [monday] = reportWeekDays(weekStart);
  const friday = reportWeekDays(weekStart).at(-1);
  if (monday === undefined || friday === undefined) return weekStart;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatRange(fromIsoDay(monday), fromIsoDay(friday));
}

/** A new activity on the given day ("Kaynak hazırlama" first, as in 3.2.3b). */
export function emptyActivityForm(day: string): ActivityForm {
  return {
    type: PeerActivityType.ResourcePrep,
    title: "",
    activityDate: day,
    durationMinutes: "",
    menteeId: "",
    description: "",
  };
}

/** The activity to send, or null while the title, the day or the minutes (1–720, whole) are not right. */
export function activityInput(
  form: ActivityForm,
): SavePeerActivityInput | null {
  const minutesText = form.durationMinutes.trim();
  const minutes = /^\d{1,3}$/.test(minutesText) ? Number(minutesText) : 0;
  const title = form.title.trim();
  if (
    title === "" ||
    minutes < 1 ||
    minutes > ACTIVITY_MINUTES_MAX ||
    !isCalendarDay(form.activityDate)
  ) {
    return null;
  }
  return {
    activityDate: form.activityDate,
    type: form.type,
    title,
    durationMinutes: minutes,
    menteeId: form.menteeId === "" ? null : form.menteeId,
    description: textOrNull(form.description),
  };
}

/** "15:00": when the activity was added, in the program's time. */
export function activityTimeLabel(createdAt: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeStyle: "short",
    timeZone: REPORT_TIME_ZONE,
  }).format(new Date(createdAt));
}

function textOrNull(value: string) {
  return value.trim() === "" ? null : value.trim();
}

/**
 * The view, week and day from the URL, each checked, with today's week and day standing in for anything missing or
 * wrong. The day always lies in the week (Monday–Friday); outside it, the week's last day up to today is taken.
 */
export function parseReportSearch(
  search: Record<string, string | undefined>,
  today: string,
): ReportSearch {
  const view = isEnumValue(PeerReportView, search.view)
    ? search.view
    : PeerReportView.Daily;
  const asked = isCalendarDay(search.day) ? search.day : today;
  const week =
    isCalendarDay(search.week) && mondayOf(search.week) === search.week
      ? search.week
      : mondayOf(asked);
  const days = reportWeekDays(week);
  const day = days.includes(asked)
    ? asked
    : (days.filter((candidate) => candidate <= today).at(-1) ?? week);
  return { view, week, day };
}

function mondayOf(day: string) {
  return reportWeekStart(fromIsoDay(day));
}

/** A real "yyyy-mm-dd" calendar day (not "2026-02-30"). */
export function isCalendarDay(value: string | undefined): value is string {
  if (value === undefined || !ISO_DAY_PATTERN.test(value)) return false;
  const date = fromIsoDay(value);
  const [year, month, dayOfMonth] = value.split("-").map(Number);
  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === dayOfMonth
  );
}

/** Which of the activity form's fields stop it from being sent, so each can be marked. */
export function invalidActivityFields(form: ActivityForm) {
  const minutesText = form.durationMinutes.trim();
  const minutes = /^\d{1,3}$/.test(minutesText) ? Number(minutesText) : 0;
  return {
    title: form.title.trim() === "",
    activityDate: !isCalendarDay(form.activityDate),
    durationMinutes: minutes < 1 || minutes > ACTIVITY_MINUTES_MAX,
  };
}

/**
 * The meeting Menteelerim's banner asks a report for ("X ile görüşmen tamamlandı"): the latest held meeting whose report
 * is not sent yet; null when every held meeting has one.
 */
export function latestUnreportedMeeting(
  meetings: readonly PeerReportMeeting[],
): PeerReportMeeting | null {
  return (
    meetings
      .filter(
        (meeting) => meetingRowBadge(meeting) !== PeerReportBadge.Completed,
      )
      .toSorted((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))[0] ?? null
  );
}

/** The days the banner looks back over: the last week, today included ("yyyy-mm-dd"). */
export function bannerWindow(today: string) {
  return { from: isoDay(addDays(fromIsoDay(today), -6)), to: today };
}
