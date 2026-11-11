import type { useTranslations } from "next-intl";

import type {
  CoordinatorAgendaItem,
  CoordinatorNextMeeting,
} from "@/interfaces/coordinator-overview";
import { relativeDayLabel } from "@/lib/utils";
import { formatDateRange } from "@/lib/format";

export enum AgendaWindow {
  Today = "TODAY",
  Week = "WEEK",
}

export type CoordinatorHomeTexts = {
  t: ReturnType<typeof useTranslations<"coordinatorHome">>;
  locale: string;
};

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function agendaForToday(
  agenda: CoordinatorAgendaItem[],
  now = new Date(),
) {
  return agenda.filter((item) => sameDay(new Date(item.at), now));
}

function dayMonth(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(date);
}

function clock(locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Bugün" or "17 Eyl", and the time unless the item is a due date. */
export function agendaWhen(
  item: CoordinatorAgendaItem,
  { t, locale }: CoordinatorHomeTexts,
  now = new Date(),
) {
  const at = new Date(item.at);
  return {
    day: sameDay(at, now) ? relativeDayLabel(0, locale) : dayMonth(at, locale),
    time: item.allDay ? t("allDay") : clock(locale).format(at),
  };
}

/** "Yarın · 14:00–15:00" for the next-meeting chip. */
export function meetingSlotLabel(
  meeting: CoordinatorNextMeeting,
  locale: string,
  now = new Date(),
) {
  const start = new Date(meeting.scheduledAt);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const day = sameDay(start, now)
    ? relativeDayLabel(0, locale)
    : sameDay(start, tomorrow)
      ? relativeDayLabel(1, locale)
      : dayMonth(start, locale);
  const end = new Date(
    start.getTime() + (meeting.durationMinutes ?? 60) * 60_000,
  );
  return `${day} · ${formatDateRange(clock(locale), start, end)}`;
}

export function hasOpenActions(actions: {
  pendingMentors: unknown[];
  awaitingTeams: unknown[];
  missingNotes: unknown[];
}) {
  return (
    actions.pendingMentors.length +
      actions.awaitingTeams.length +
      actions.missingNotes.length >
    0
  );
}
