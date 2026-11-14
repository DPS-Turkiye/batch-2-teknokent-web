import {
  PEER_MENTOR_SKILLS,
  PeerReportStatus,
  type PeerMentorSkill,
  type PeerReportDay,
  type PeerWeeklyReport,
  type PeerWeeklySummary,
  type SavePeerWeeklyReportInput,
} from "@/interfaces/peer-reports";
import { fromIsoDay, peerReportBadge } from "@/lib/peer-reports";
import type { PeerReportBadge } from "@/types/peer-reports";
import {
  WeeklyCheck,
  WeeklyQuestion,
  WeeklyStatusNote,
  WeeklySubmitBlock,
  type WeeklyAnswers,
  type WeeklyCheckItem,
  type WeeklySkillBar,
} from "@/types/peer-weekly-report";

export const WEEKLY_QUESTIONS = Object.values(WeeklyQuestion);

/** Report times are shown on the program's clock, wherever the browser is. */
const REPORT_TIME_ZONE = "Europe/Istanbul";

export type WeeklyOutcome = PeerWeeklySummary["outcomes"][number];

/** The saved evaluation as editable text. */
export function weeklyAnswers(
  report: Pick<PeerWeeklyReport, WeeklyQuestion>,
): WeeklyAnswers {
  return {
    [WeeklyQuestion.NeedsObserved]: report.needsObserved ?? "",
    [WeeklyQuestion.Growth]: report.growth ?? "",
    [WeeklyQuestion.NextWeekPlan]: report.nextWeekPlan ?? "",
  };
}

/** The save payload: trimmed answers, null for a blank one. */
export function toWeeklyInput(
  answers: WeeklyAnswers,
): SavePeerWeeklyReportInput {
  const value = (question: WeeklyQuestion) => answers[question].trim() || null;
  return {
    needsObserved: value(WeeklyQuestion.NeedsObserved),
    growth: value(WeeklyQuestion.Growth),
    nextWeekPlan: value(WeeklyQuestion.NextWeekPlan),
  };
}

function answeredQuestions(answers: WeeklyAnswers) {
  return WEEKLY_QUESTIONS.filter((question) => answers[question].trim()).length;
}

function checkItem(
  check: WeeklyCheck,
  done: number,
  total: number,
  blocking: boolean,
): WeeklyCheckItem {
  return { check, done, total, complete: done >= total, blocking };
}

/**
 * The side card's checklist. Only the meeting reports and the evaluation gate sending (Arya, 14 Nov); the daily
 * reports are shown for the mentor's own overview.
 */
export function weeklyChecklist(
  report: PeerWeeklyReport,
  answers: WeeklyAnswers,
): WeeklyCheckItem[] {
  return [
    checkItem(
      WeeklyCheck.DailyReports,
      report.dailySent,
      report.dailyRequired,
      false,
    ),
    checkItem(
      WeeklyCheck.MeetingReports,
      report.summary.meetingReportsSent,
      report.summary.meetingReportsTotal,
      true,
    ),
    checkItem(
      WeeklyCheck.Evaluation,
      answeredQuestions(answers),
      WEEKLY_QUESTIONS.length,
      true,
    ),
  ];
}

/**
 * Why the week can't be sent now, or null when it can. It opens on Friday 18:00 (`opensAt`) and stays sendable after
 * the Monday 23:59 deadline, marked late.
 */
export function weeklySubmitBlock(
  report: PeerWeeklyReport,
  answers: WeeklyAnswers,
  now: Date,
): WeeklySubmitBlock | null {
  if (!report.editable) return WeeklySubmitBlock.Locked;
  const opensAt = Date.parse(report.opensAt);
  // An unreadable opening time keeps the week closed rather than letting it go early.
  if (Number.isNaN(opensAt) || now.getTime() < opensAt)
    return WeeklySubmitBlock.NotOpen;
  const blocked = weeklyChecklist(report, answers).find(
    (item) => item.blocking && !item.complete,
  );
  switch (blocked?.check) {
    case undefined:
    case WeeklyCheck.DailyReports:
      return null;
    case WeeklyCheck.MeetingReports:
      return WeeklySubmitBlock.MeetingReports;
    case WeeklyCheck.Evaluation:
      return WeeklySubmitBlock.Evaluation;
  }
}

/**
 * Still not sent once the deadline has come. The backend's deadline is the midnight that ends Monday, so 00:00 is late;
 * an unreadable deadline never makes a week late.
 */
export function isWeeklyLate(report: PeerWeeklyReport, now: Date) {
  return report.editable && now.getTime() >= Date.parse(report.deadline);
}

/** A skill this client doesn't know yet goes after the known ones. */
function catalogueOrder(skill: PeerMentorSkill) {
  const index = PEER_MENTOR_SKILLS.indexOf(skill);
  return index < 0 ? PEER_MENTOR_SKILLS.length : index;
}

/** Most used first; equally used skills keep the catalogue's order. Bars are sized against the week's meetings. */
export function weeklySkillBars(summary: PeerWeeklySummary): WeeklySkillBar[] {
  return summary.skills
    .toSorted(
      (a, b) =>
        b.meetings - a.meetings ||
        catalogueOrder(a.skill) - catalogueOrder(b.skill),
    )
    .map(({ skill, meetings }) => ({
      skill,
      meetings,
      percent:
        summary.meetings > 0
          ? Math.min(100, Math.round((meetings / summary.meetings) * 100))
          : 0,
    }));
}

function byMeetingTime(outcome: WeeklyOutcome) {
  return outcome.reports.toSorted(
    (a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt),
  );
}

/** A mentee's written outcomes for the week, in meeting order, each with its meeting. */
export function outcomeLines(outcome: WeeklyOutcome) {
  return byMeetingTime(outcome).flatMap((report) => {
    const text = report.outcome?.trim();
    return text ? [{ meetingId: report.meetingId, text }] : [];
  });
}

/** "2 / 3 eylem tamamlandı", "Tüm eylemler tamamlandı", or nothing for a mentee without action steps. */
export function outcomeActionProgress(outcome: WeeklyOutcome) {
  if (outcome.actionsTotal <= 0) return null;
  return {
    done: outcome.actionsDone,
    total: outcome.actionsTotal,
    all: outcome.actionsDone >= outcome.actionsTotal,
  };
}

/** Meeting reports of the week not sent yet ("2 rapor eksik"). */
export function missingMeetingReports(summary: PeerWeeklySummary) {
  return Math.max(0, summary.meetingReportsTotal - summary.meetingReportsSent);
}

/** The reason shown under a disabled send button; a sent week shows no button, so no reason. */
export function weeklySubmitReason(block: WeeklySubmitBlock | null) {
  return block === WeeklySubmitBlock.Locked ? null : block;
}

/** The first and last working day of the report, for "Pzt · 9 Kasım – Cum · 13 Kasım". */
export function weeklySpan(report: PeerWeeklyReport) {
  return {
    first: report.days[0]?.date ?? report.weekStart,
    last: report.days.at(-1)?.date ?? report.weekStart,
  };
}

/** "Raporları gör" opens the mentee's latest meeting report of the week. */
export function latestOutcomeMeetingId(outcome: WeeklyOutcome) {
  return byMeetingTime(outcome).at(-1)?.meetingId ?? null;
}

/**
 * A day in the report tab's daily view (Figma 221:73). The reports tab shell owns these params; switch to its own
 * builder once it lands.
 */
export function peerDailyReportHref(day: string) {
  const params = new URLSearchParams({ tab: "report", view: "daily", day });
  return `/student/peer-mentoring?${params.toString()}`;
}

/** The meeting report page (Figma 220:2). */
export function peerMeetingReportHref(meetingId: string) {
  return `/student/peer-mentoring/reports/meetings/${encodeURIComponent(meetingId)}`;
}

/** "Ayşe, Emre, Deniz" under "Görüşülen mentee". */
export function menteeFirstNames(summary: PeerWeeklySummary) {
  return summary.mentees.map(
    (mentee) => mentee.fullName.trim().split(/\s+/)[0] ?? mentee.fullName,
  );
}

/** "Pzt" and "9 Kasım" for a day card. */
export function formatReportDay(day: string, locale: string) {
  const date = fromIsoDay(day);
  return {
    weekday: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date),
    date: new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
    }).format(date),
  };
}

/** "16 Kasım, 23:59" on the program's clock: the deadline, or the Friday 18:00 the week opens. Empty if unreadable. */
export function formatReportTime(value: string, locale: string) {
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return "";
  const day = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: REPORT_TIME_ZONE,
  }).format(at);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: REPORT_TIME_ZONE,
  }).format(at);
  return `${day}, ${time}`;
}

export type WeeklyDayCard = {
  date: string;
  /** Null for a day nobody started ("Henüz başlamadı"). */
  badge: PeerReportBadge | null;
};

/** The side card's day rows, each with its pill. */
export function weeklyDayCards(
  days: readonly PeerReportDay[],
): WeeklyDayCard[] {
  return days.map((day) => ({
    date: day.date,
    badge: peerReportBadge(day.status, day.missingMeetingReports),
  }));
}

/** What the side card says about the week's state, if anything. */
export function weeklyStatusNote(
  report: PeerWeeklyReport,
  now: Date,
): WeeklyStatusNote | null {
  switch (report.status) {
    case PeerReportStatus.InReview:
      return WeeklyStatusNote.InReview;
    case PeerReportStatus.Approved:
      return WeeklyStatusNote.Approved;
    case PeerReportStatus.RevisionRequested:
      return WeeklyStatusNote.Revision;
    case PeerReportStatus.Draft:
    case null:
      return isWeeklyLate(report, now) ? WeeklyStatusNote.Late : null;
  }
}

const ONE_MINUTE_MS = 60_000;

/** The backend's deadline is the midnight after Monday; mentors read it as "16 Kasım, 23:59". Empty if unreadable. */
export function formatReportDeadline(deadline: string, locale: string) {
  const at = Date.parse(deadline);
  if (Number.isNaN(at)) return "";
  return formatReportTime(new Date(at - ONE_MINUTE_MS).toISOString(), locale);
}
