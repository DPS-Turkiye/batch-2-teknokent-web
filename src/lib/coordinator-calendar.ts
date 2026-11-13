import type { useTranslations } from "next-intl";

import { clientText } from "@/i18n/client-texts";
import type {
  CoordinatorCalendar,
  CoordinatorCalendarConflict,
  CoordinatorCalendarItem,
} from "@/interfaces/coordinator-calendar";
import { CoordinatorAgendaKind } from "@/interfaces/coordinator-overview";
import { ProgramEventKind } from "@/interfaces/coordinator-program";
import {
  MeetingProposalStatus,
  type MeetingProposal,
} from "@/interfaces/meeting-proposal";
import { placeInLanes, type Placed } from "@/lib/calendar";
import { formatDateRange } from "@/lib/format";
import { formatDayMonth } from "@/lib/utils";

export enum CalendarView {
  Week = "WEEK",
  Month = "MONTH",
  List = "LIST",
}

export type CalendarTexts = {
  t: ReturnType<typeof useTranslations<"coordinatorCalendar">>;
  locale: string;
};

/** The week grid runs 09:00–19:00; earlier or later items stick to its edges. */
export const GRID_START_HOUR = 9;
export const GRID_HOURS = 10;
const DEFAULT_MINUTES = 60;

function clock(locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

/** Monday of the date's week, at local midnight. */
export function startOfWeek(date: Date) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return addDays(day, -((day.getDay() + 6) % 7));
}

/** "2026-09-14" in local time, the format the calendar endpoint takes. */
export function isoDay(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The days a view covers: one week, or the whole weeks around a month. */
export function viewDays(view: CalendarView, anchor: Date) {
  if (view !== CalendarView.Month) {
    const monday = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  }
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const start = startOfWeek(first);
  const end = addDays(startOfWeek(last), 6);
  const days: Date[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) days.push(day);
  return days;
}

export function viewRange(view: CalendarView, anchor: Date) {
  const days = viewDays(view, anchor);
  const start = days[0] ?? anchor;
  const end = days[days.length - 1] ?? anchor;
  return { from: isoDay(start), to: isoDay(end) };
}

/** "14–20 Eylül 2026", "28 Eylül – 4 Ekim 2026" or "Eylül 2026". */
export function rangeLabel(view: CalendarView, anchor: Date, locale: string) {
  if (view === CalendarView.Month) {
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    }).format(anchor);
  }
  const days = viewDays(view, anchor);
  const start = days[0] ?? anchor;
  const end = days[6] ?? days[days.length - 1] ?? anchor;
  return formatDateRange(
    new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    start,
    end,
  );
}

export function shiftAnchor(view: CalendarView, anchor: Date, step: 1 | -1) {
  if (view === CalendarView.Month) {
    return new Date(anchor.getFullYear(), anchor.getMonth() + step, 1);
  }
  return addDays(anchor, 7 * step);
}

export function sameDay(a: Date, b: Date) {
  return isoDay(a) === isoDay(b);
}

export function weekdayLabel(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: "short" })
    .format(date)
    .replace(".", "");
}

export function timeLabel(value: string, locale: string) {
  return clock(locale).format(new Date(value));
}

export function longDayLabel(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function itemEnd(item: CoordinatorCalendarItem) {
  if (item.endsAt) return new Date(item.endsAt);
  return item.kind === CoordinatorAgendaKind.Deadline
    ? null
    : new Date(new Date(item.startsAt).getTime() + DEFAULT_MINUTES * 60_000);
}

/** "Çar 16 Eyl · 14:00–15:00", or just the day and time for a deadline. */
export function slotLabel(item: CoordinatorCalendarItem, locale: string) {
  const start = new Date(item.startsAt);
  const day = `${weekdayLabel(start, locale)} ${formatDayMonth(start, locale)}`;
  const end = itemEnd(item);
  return end
    ? `${day} · ${formatDateRange(clock(locale), start, end)}`
    : `${day} · ${clock(locale).format(start)}`;
}

export function itemsOnDay(items: CoordinatorCalendarItem[], day: Date) {
  return items.filter((item) => sameDay(new Date(item.startsAt), day));
}

export type PlacedItem = Placed<CoordinatorCalendarItem>;

export function placeDayItems(items: CoordinatorCalendarItem[]): PlacedItem[] {
  return placeInLanes(
    items,
    (item) => {
      const start = new Date(item.startsAt);
      const end = itemEnd(item);
      return {
        start,
        hours: end ? (end.getTime() - start.getTime()) / 3_600_000 : 1,
      };
    },
    { startHour: GRID_START_HOUR, hours: GRID_HOURS },
  );
}

/** "Nova Robotics (11:00) ve Vega (11:30) görüşmeleri üst üste bindi." */
export function conflictSummary(
  conflict: CoordinatorCalendarConflict,
  items: CoordinatorCalendarItem[],
  { t, locale }: CalendarTexts,
) {
  const meetings = conflict.meetingIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is CoordinatorCalendarItem => Boolean(item));
  const names = meetings.map(
    (item) =>
      `${item.organizationName ?? item.title} (${timeLabel(item.startsAt, locale)})`,
  );
  const day = meetings[0]
    ? weekdayLabel(new Date(meetings[0].startsAt), locale)
    : "";
  return {
    heading: t("conflictHeading", { count: conflict.meetingIds.length }),
    who: day ? `${conflict.mentorName} · ${day}` : conflict.mentorName,
    body: t("conflictBody", {
      names: new Intl.ListFormat(locale, { type: "conjunction" }).format(names),
    }),
  };
}

export function mentorshipHref(mentorshipId: string) {
  return `/coordinator/mentorships?mentorship=${encodeURIComponent(mentorshipId)}`;
}

export type EventDraft = {
  programId: string;
  title: string;
  kind: ProgramEventKind;
  day: string;
  startTime: string;
  endTime: string;
  description: string;
};

export function emptyEventDraft(programId: string, day: Date): EventDraft {
  return {
    programId,
    title: "",
    kind: ProgramEventKind.Event,
    day: isoDay(day),
    startTime: "10:00",
    endTime: "",
    description: "",
  };
}

/** The first problem with the draft, or null when it can be saved. */
export function eventDraftError(draft: EventDraft) {
  if (!draft.programId) return clientText("coordinatorEvent.pickProgram");
  if (!draft.title.trim()) return clientText("coordinatorEvent.title");
  if (!draft.day || !draft.startTime) {
    return clientText("coordinatorEvent.when");
  }
  if (draft.endTime && draft.endTime <= draft.startTime) {
    return clientText("coordinatorEvent.endAfterStart");
  }
  return null;
}

export function eventInput(draft: EventDraft) {
  const at = (time: string) =>
    new Date(`${draft.day}T${time}:00`).toISOString();
  return {
    title: draft.title.trim(),
    kind: draft.kind,
    startsAt: at(draft.startTime),
    endsAt: draft.endTime ? at(draft.endTime) : null,
    description: draft.description.trim() || null,
  };
}

export function isRecordingFull(
  item: CoordinatorCalendarItem,
  capacity: number,
) {
  return capacity > 0 && (item.recordingLoad ?? 0) >= capacity;
}

/** "Kayıt botu 1/2", or "dolu" once every bot slot at that time is taken. */
export function recordingNote(
  item: CoordinatorCalendarItem,
  capacity: number,
  t: CalendarTexts["t"],
) {
  if (item.recordingLoad == null || capacity <= 0) return null;
  const values = { load: item.recordingLoad, capacity };
  return isRecordingFull(item, capacity)
    ? t("recordingFull", values)
    : t("recording", values);
}

export function fullRecordingCount(data: CoordinatorCalendar) {
  return data.items.filter((item) =>
    isRecordingFull(item, data.recordingCapacity),
  ).length;
}

/** Pending coordinator proposals inside the visible range, drawn as dashed "Önerilen slot" meetings. */
export function proposalItems(
  proposals: MeetingProposal[],
  range: { from: string; to: string },
  title: string,
): CoordinatorCalendarItem[] {
  return proposals
    .filter(
      // A proposal outside any program (a mentor and a team on their own) has no place here.
      (proposal): proposal is MeetingProposal & { programId: string } =>
        proposal.programId !== null &&
        proposal.status === MeetingProposalStatus.Pending &&
        isoDay(new Date(proposal.scheduledAt)) >= range.from &&
        isoDay(new Date(proposal.scheduledAt)) <= range.to,
    )
    .map((proposal) => ({
      id: `proposal-${proposal.id}`,
      proposalId: proposal.id,
      kind: CoordinatorAgendaKind.Meeting,
      title,
      startsAt: proposal.scheduledAt,
      endsAt: new Date(
        new Date(proposal.scheduledAt).getTime() +
          proposal.durationMinutes * 60_000,
      ).toISOString(),
      programId: proposal.programId,
      programName: proposal.programName ?? "",
      mentorshipId: proposal.mentorshipId,
      mentorId: proposal.mentorId,
      mentorName: proposal.mentorName,
      organizationId: proposal.organizationId,
      organizationName: proposal.organizationName,
      topic: proposal.agenda,
      sequence: null,
      meetLink: null,
      description: null,
      conflict: false,
      recordingLoad: null,
    }));
}
