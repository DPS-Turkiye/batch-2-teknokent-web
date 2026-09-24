import type {
  CoordinatorCalendarConflict,
  CoordinatorCalendarItem,
} from "@/interfaces/coordinator-calendar";
import { CoordinatorAgendaKind } from "@/interfaces/coordinator-overview";
import { ProgramEventKind } from "@/interfaces/coordinator-program";
import { formatDayMonth } from "@/lib/utils";

export enum CalendarView {
  Week = "WEEK",
  Month = "MONTH",
  List = "LIST",
}

export const CALENDAR_VIEW_LABELS: Record<CalendarView, string> = {
  [CalendarView.Week]: "Hafta",
  [CalendarView.Month]: "Ay",
  [CalendarView.List]: "Liste",
};

/** The week grid runs 09:00–19:00; earlier or later items stick to its edges. */
export const GRID_START_HOUR = 9;
export const GRID_HOURS = 10;
const DEFAULT_MINUTES = 60;

const WEEKDAY = new Intl.DateTimeFormat("tr-TR", { weekday: "short" });
const DAY_MONTH = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
});
const MONTH_YEAR = new Intl.DateTimeFormat("tr-TR", {
  month: "long",
  year: "numeric",
});
const LONG_DAY = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const TIME = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
});

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
  return { from: isoDay(days[0]), to: isoDay(days[days.length - 1]) };
}

/** "14 – 20 Eylül 2026", "28 Eylül – 4 Ekim 2026" or "Eylül 2026". */
export function rangeLabel(view: CalendarView, anchor: Date) {
  if (view === CalendarView.Month) return MONTH_YEAR.format(anchor);
  const days = viewDays(view, anchor);
  const first = days[0];
  const last = days[6];
  const year = last.getFullYear();
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${DAY_MONTH.format(last)} ${year}`;
  }
  return `${DAY_MONTH.format(first)} – ${DAY_MONTH.format(last)} ${year}`;
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

export function weekdayLabel(date: Date) {
  return WEEKDAY.format(date).replace(".", "");
}

export function timeLabel(value: string) {
  return TIME.format(new Date(value));
}

export function longDayLabel(date: Date) {
  return LONG_DAY.format(date);
}

function itemEnd(item: CoordinatorCalendarItem) {
  if (item.endsAt) return new Date(item.endsAt);
  return item.kind === CoordinatorAgendaKind.Deadline
    ? null
    : new Date(new Date(item.startsAt).getTime() + DEFAULT_MINUTES * 60_000);
}

/** "Çar 16 Eyl · 14:00–15:00", or just the day and time for a deadline. */
export function slotLabel(item: CoordinatorCalendarItem) {
  const start = new Date(item.startsAt);
  const day = `${weekdayLabel(start)} ${formatDayMonth(start)}`;
  const end = itemEnd(item);
  return end
    ? `${day} · ${TIME.format(start)}–${TIME.format(end)}`
    : `${day} · ${TIME.format(start)}`;
}

export function itemsOnDay(items: CoordinatorCalendarItem[], day: Date) {
  return items.filter((item) => sameDay(new Date(item.startsAt), day));
}

export type PlacedItem = {
  item: CoordinatorCalendarItem;
  /** Hours from the grid's first row, clamped into the grid. */
  top: number;
  height: number;
  /** Items overlapping an earlier one shift right so both stay visible. */
  lane: number;
};

export function placeDayItems(items: CoordinatorCalendarItem[]): PlacedItem[] {
  const sorted = [...items].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );
  const placed: PlacedItem[] = [];
  for (const item of sorted) {
    const start = new Date(item.startsAt);
    const startHours = start.getHours() + start.getMinutes() / 60;
    const end = itemEnd(item);
    const hours = end ? (end.getTime() - start.getTime()) / 3_600_000 : 1;
    const top = Math.min(
      Math.max(startHours - GRID_START_HOUR, 0),
      GRID_HOURS - 0.75,
    );
    const height = Math.max(Math.min(hours, GRID_HOURS - top), 0.75);
    const lane = placed.filter(
      (other) => other.top + other.height > top,
    ).length;
    placed.push({ item, top, height, lane });
  }
  return placed;
}

/** "Nova Robotics (11:00) ve Vega (11:30) görüşmeleri üst üste bindi." */
export function conflictSummary(
  conflict: CoordinatorCalendarConflict,
  items: CoordinatorCalendarItem[],
) {
  const meetings = conflict.meetingIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is CoordinatorCalendarItem => !!item);
  const names = meetings.map(
    (item) =>
      `${item.organizationName ?? item.title} (${timeLabel(item.startsAt)})`,
  );
  const joined =
    names.length > 1
      ? `${names.slice(0, -1).join(", ")} ve ${names[names.length - 1]}`
      : (names[0] ?? "");
  const day = meetings[0] ? weekdayLabel(new Date(meetings[0].startsAt)) : "";
  return {
    heading: `${conflict.meetingIds.length} çakışma`,
    who: day ? `${conflict.mentorName} · ${day}` : conflict.mentorName,
    body: `${joined} görüşmeleri üst üste bindi.`,
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

/** The first problem with the draft, in Turkish, or null when it can be saved. */
export function eventDraftError(draft: EventDraft) {
  if (!draft.programId) return "Bir program seçin.";
  if (!draft.title.trim()) return "Başlık girin.";
  if (!draft.day || !draft.startTime) return "Tarih ve saat seçin.";
  if (draft.endTime && draft.endTime <= draft.startTime) {
    return "Bitiş saati başlangıçtan sonra olmalı.";
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
