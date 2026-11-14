import {
  PeerActionOwner,
  PeerReportStatus,
  type PeerMeetingReport,
  type SavePeerMeetingReportInput,
} from "@/interfaces/peer-reports";
import { withKey, withKeys } from "@/lib/keyed-list";
import { formatLongDate, toDateTimeLocalValue } from "@/lib/utils";
import {
  MeetingReportSection,
  SupportChoice,
  type MeetingReportActionRow,
  type MeetingReportForm,
} from "@/types/peer-meeting-report";

/** The 1–5 scale of "Görüşme ne kadar verimli geçti?". */
export const PRODUCTIVITY_SCALE = [1, 2, 3, 4, 5] as const;

/** The backend's limits, so the form stops where the server would refuse. */
export const MEETING_REPORT_TEXT_MAX = 4000;
export const MEETING_REPORT_ACTION_TEXT_MAX = 500;
export const MEETING_REPORT_ACTIONS_MAX = 20;
export const MEETING_REPORT_DURATION_MAX = 600;

/** The form's starting state from a saved report, or from the calendar's prefill of a new one. */
export function meetingReportForm(
  report: PeerMeetingReport,
): MeetingReportForm {
  return {
    meetingType: report.meetingType,
    meetingFormat: report.meetingFormat,
    actualDurationMinutes:
      report.actualDurationMinutes === null
        ? ""
        : String(report.actualDurationMinutes),
    topics: [...report.topics],
    menteeNeed: report.menteeNeed ?? "",
    discussion: report.discussion ?? "",
    approach: report.approach ?? "",
    skills: [...report.skills],
    skillExample: report.skillExample ?? "",
    outcome: report.outcome ?? "",
    actions: withKeys(
      report.actions.map((action) => ({
        id: action.id,
        text: action.text,
        owner: action.owner,
        dueDate: action.dueDate ?? "",
        done: action.done,
      })),
    ),
    followUpNeeded: report.followUpNeeded,
    followUpAt: report.followUpAt
      ? toDateTimeLocalValue(new Date(report.followUpAt))
      : "",
    productivity: report.productivity,
    nextTime: report.nextTime ?? "",
    coordinatorSupportNeeded: report.coordinatorSupportNeeded,
  };
}

/** The body the backend saves. Blank text is sent as null; a blank action row is left out. */
export function meetingReportInput(
  form: MeetingReportForm,
): SavePeerMeetingReportInput {
  return {
    meetingType: form.meetingType,
    meetingFormat: form.meetingFormat,
    actualDurationMinutes: parseDuration(form.actualDurationMinutes),
    topics: form.topics,
    menteeNeed: textOrNull(form.menteeNeed),
    discussion: textOrNull(form.discussion),
    approach: textOrNull(form.approach),
    skills: form.skills,
    skillExample: textOrNull(form.skillExample),
    outcome: textOrNull(form.outcome),
    actions: form.actions
      .filter((action) => action.text.trim() !== "")
      .map((action) => ({
        id: action.id,
        text: action.text.trim(),
        owner: action.owner,
        dueDate: action.dueDate === "" ? null : action.dueDate,
        done: action.done,
      })),
    followUpNeeded: form.followUpNeeded,
    followUpAt:
      form.followUpNeeded && form.followUpAt !== ""
        ? new Date(form.followUpAt).toISOString()
        : null,
    productivity: form.productivity,
    nextTime: textOrNull(form.nextTime),
    coordinatorSupportNeeded: form.coordinatorSupportNeeded,
  };
}

/**
 * The sections whose required ("*") answers are still empty, the way the backend checks them on send. The form marks
 * these red instead of sending a report the server would refuse.
 */
export function missingMeetingReportSections(
  form: MeetingReportForm,
): MeetingReportSection[] {
  const missing: MeetingReportSection[] = [];
  if (
    form.meetingType === null ||
    form.meetingFormat === null ||
    parseDuration(form.actualDurationMinutes) === null
  ) {
    missing.push(MeetingReportSection.Meeting);
  }
  if (form.topics.length === 0 || blank(form.menteeNeed)) {
    missing.push(MeetingReportSection.Topic);
  }
  if (blank(form.discussion) || blank(form.approach)) {
    missing.push(MeetingReportSection.Details);
  }
  if (form.skills.length === 0 || blank(form.skillExample)) {
    missing.push(MeetingReportSection.Skills);
  }
  if (blank(form.outcome) || (form.followUpNeeded && form.followUpAt === "")) {
    missing.push(MeetingReportSection.Outcomes);
  }
  if (
    form.productivity === null ||
    blank(form.nextTime) ||
    form.coordinatorSupportNeeded === null
  ) {
    missing.push(MeetingReportSection.Evaluation);
  }
  return missing;
}

/**
 * The typed duration as whole minutes the backend takes (1–600), or null. Strict on purpose: "35abc", "35.9" or
 * "1e2" are not quietly turned into another number than the one on screen.
 */
export function parseDuration(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d{1,3}$/.test(trimmed)) return null;
  const minutes = Number(trimmed);
  return minutes >= 1 && minutes <= MEETING_REPORT_DURATION_MAX
    ? minutes
    : null;
}

/** The 1–5 scale as the choice control's ids. */
export const PRODUCTIVITY_CHOICES = PRODUCTIVITY_SCALE.map(String);

export function productivityChoice(value: number | null): string | null {
  return value === null ? null : String(value);
}

export function productivityValue(choice: string): number | null {
  const value = Number(choice);
  return PRODUCTIVITY_SCALE.some((score) => score === value) ? value : null;
}

/** Adds the value if absent, removes it if present, keeping the original order. */
export function toggled<T>(values: readonly T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

/** A new, empty action step for the mentee ("Eylem adımı ekle"). */
export function newActionRow(): MeetingReportActionRow {
  return withKey({
    id: null,
    text: "",
    owner: PeerActionOwner.Mentee,
    dueDate: "",
    done: false,
  });
}

/** "Taslak" for a report never saved too: the screen shows the pill a draft has. */
export function meetingReportShownStatus(
  status: PeerReportStatus | null,
): PeerReportStatus {
  return status ?? PeerReportStatus.Draft;
}

/** The yes/no control's state for the stored answer (none yet: nothing chosen). */
export function supportChoice(value: boolean | null): SupportChoice | null {
  if (value === null) return null;
  return value ? SupportChoice.Yes : SupportChoice.No;
}

export function supportValue(choice: SupportChoice): boolean {
  return choice === SupportChoice.Yes;
}

/** "12 Kasım 2026, Perşembe" */
export function meetingDayLabel(at: string, locale: string): string {
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(
    new Date(at),
  );
  return `${formatLongDate(at, locale)}, ${weekday}`;
}

/** "14:00 – 14:30": the planned slot. */
export function meetingSlotLabel(
  at: string,
  minutes: number,
  locale: string,
): string {
  const time = new Intl.DateTimeFormat(locale, { timeStyle: "short" });
  const start = new Date(at);
  const end = new Date(start.getTime() + minutes * 60_000);
  return `${time.format(start)} – ${time.format(end)}`;
}

function textOrNull(value: string) {
  return blank(value) ? null : value.trim();
}

function blank(value: string) {
  return value.trim() === "";
}
