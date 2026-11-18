import type { useTranslations } from "next-intl";

import {
  ProgramCalendarEntryKind,
  type MemberProgramEvent,
  type ProgramCalendarPlanItem,
} from "@/interfaces/coordinator-program";
import { timeLabel } from "@/lib/calendar";

export type ProgramCalendarT = ReturnType<
  typeof useTranslations<"programCalendar">
>;

/** "Program oturumu", "Özel gün", "Program etkinliği", "Son tarih". */
export function programEntryKindLabel(
  kind: ProgramCalendarEntryKind,
  t: ProgramCalendarT,
) {
  switch (kind) {
    case ProgramCalendarEntryKind.Session:
      return t("kinds.session");
    case ProgramCalendarEntryKind.SpecialDay:
      return t("kinds.specialDay");
    case ProgramCalendarEntryKind.Deadline:
      return t("kinds.deadline");
    case ProgramCalendarEntryKind.Event:
      return t("kinds.event");
  }
}

export function isAllDay(entry: { plan: ProgramCalendarPlanItem | null }) {
  return entry.plan?.allDay ?? false;
}

/**
 * The lines under an entry's title: the lesson's speaker, the week it belongs to, its place, a special day's details
 * and an event's own description.
 */
export function programEntryLines(
  entry: {
    plan: ProgramCalendarPlanItem | null;
    description: string | null;
  },
  t: ProgramCalendarT,
) {
  const lines: string[] = [];
  const plan = entry.plan;
  if (plan?.speaker) lines.push(t("speaker", { name: plan.speaker }));
  if (plan?.week != null && plan.weekTitle) {
    lines.push(t("week", { week: plan.week, title: plan.weekTitle }));
  }
  if (plan?.place) lines.push(t("place", { place: plan.place }));
  lines.push(...(plan?.details ?? []));
  const description = entry.description?.trim();
  if (description) lines.push(description);
  return lines;
}

/** "Tüm gün", "20:00–22:00" or "13:00" when the plan prints no end. */
export function programEntryTime(
  entry: {
    startsAt: string;
    endsAt: string | null;
    plan: ProgramCalendarPlanItem | null;
  },
  locale: string,
  t: ProgramCalendarT,
) {
  if (isAllDay(entry)) return t("allDay");
  const start = timeLabel(entry.startsAt, locale);
  return entry.endsAt ? `${start}–${timeLabel(entry.endsAt, locale)}` : start;
}

/** "18 Kasım 2026 Çarşamba · Tüm gün" */
export function programEntryWhen(
  entry: MemberProgramEvent,
  locale: string,
  t: ProgramCalendarT,
) {
  const day = new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(
    new Date(entry.startsAt),
  );
  return `${day} · ${programEntryTime(entry, locale, t)}`;
}

/**
 * The days a week view shows, as the range the events endpoint takes: the first day's midnight to the next one after
 * the last, in the browser's zone (the app's users are in Istanbul, as the backend's days are).
 */
export function programEventRange(days: readonly Date[]) {
  const first = days[0] ?? new Date();
  const last = days.at(-1) ?? first;
  const from = new Date(first.getFullYear(), first.getMonth(), first.getDate());
  const to = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
  return { from, to };
}

/** Each day's program entries, in start order, for a row of day columns. */
export function programEventsByDay(
  events: readonly MemberProgramEvent[],
  days: readonly Date[],
) {
  const sorted = [...events].sort(
    (left, right) =>
      new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );
  return days.map((day) =>
    sorted.filter(
      (event) => new Date(event.startsAt).toDateString() === day.toDateString(),
    ),
  );
}
