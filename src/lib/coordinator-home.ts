import {
  type CoordinatorAgendaItem,
  CoordinatorAgendaKind,
  type CoordinatorNextMeeting,
} from "@/interfaces/coordinator-overview";

export enum AgendaWindow {
  Today = "TODAY",
  Week = "WEEK",
}

export const AGENDA_KIND_LABELS: Record<CoordinatorAgendaKind, string> = {
  [CoordinatorAgendaKind.Meeting]: "Görüşme",
  [CoordinatorAgendaKind.Event]: "Etkinlik",
  [CoordinatorAgendaKind.Deadline]: "Deadline",
  [CoordinatorAgendaKind.Action]: "Aksiyon",
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

const DAY_MONTH = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
});
const TIME = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
});

/** "Bugün" or "17 Eyl", and the time unless the item is a due date. */
export function agendaWhen(item: CoordinatorAgendaItem, now = new Date()) {
  const at = new Date(item.at);
  return {
    day: sameDay(at, now) ? "Bugün" : DAY_MONTH.format(at),
    time: item.allDay ? "Gün içinde" : TIME.format(at),
  };
}

/** "Yarın · 14:00–15:00" for the next-meeting chip. */
export function meetingSlotLabel(
  meeting: CoordinatorNextMeeting,
  now = new Date(),
) {
  const start = new Date(meeting.scheduledAt);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const day = sameDay(start, now)
    ? "Bugün"
    : sameDay(start, tomorrow)
      ? "Yarın"
      : DAY_MONTH.format(start);
  const end = new Date(
    start.getTime() + (meeting.durationMinutes ?? 60) * 60_000,
  );
  return `${day} · ${TIME.format(start)}–${TIME.format(end)}`;
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
