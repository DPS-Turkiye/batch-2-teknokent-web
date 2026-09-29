import { ActionItemStatus, type ActionItem } from "@/interfaces/action-item";
import type { DocumentRequestItem } from "@/interfaces/document-request";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { formatMeetingShort } from "@/lib/format";
import { isMeetingEnded } from "@/lib/mentorship-workspace";
import { formatFileSize, formatShortDate } from "@/lib/utils";
import { mentorMeetingEvaluationHref } from "@/lib/mentor-evaluation";

/** A past meeting is the last one, not the next one. */
export function conversationMeetingLabel(
  meeting: MeetingItem | null,
  now = new Date(),
) {
  if (!meeting) return null;
  const when = formatMeetingShort(meeting.scheduledAt);
  return isMeetingEnded(meeting, now)
    ? `Son görüşme ${when}`
    : `Sonraki görüşme ${when}`;
}

/** Calendar weeks follow the availability service's Istanbul business timezone. */
export function mentorWeekMeetingCount(
  meetings: MeetingItem[],
  now = new Date(),
) {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const start = new Date(`${day}T00:00:00+03:00`);
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  start.setUTCDate(start.getUTCDate() - ((weekday + 6) % 7));
  const end = start.getTime() + 7 * 86_400_000;
  return meetings.filter((meeting) => {
    const time = Date.parse(meeting.scheduledAt);
    return (
      meeting.status !== MeetingStatus.Cancelled &&
      time >= start.getTime() &&
      time < end
    );
  }).length;
}

export function isOpenActionItem(item: ActionItem) {
  return (
    item.status === ActionItemStatus.Open ||
    item.status === ActionItemStatus.InProgress
  );
}

export function isOverdueActionItem(item: ActionItem, now = new Date()) {
  if (!isOpenActionItem(item) || !item.dueDate) return false;
  return Date.parse(item.dueDate) < now.getTime();
}

/** Share of a mentorship's action items that are done, or null when it has none. */
export function mentorshipProgress(items: ActionItem[]) {
  const counted = items.filter(
    (item) => item.status !== ActionItemStatus.Cancelled,
  );
  if (counted.length === 0) return null;
  const done = counted.filter(
    (item) => item.status === ActionItemStatus.Completed,
  ).length;
  return Math.round((done / counted.length) * 100);
}

/** Completed action items over the ones that still count, e.g. `{ done: 3, total: 4 }`. */
export function mentorshipTaskRatio(items: ActionItem[]) {
  const counted = items.filter(
    (item) => item.status !== ActionItemStatus.Cancelled,
  );
  if (counted.length === 0) return null;
  return {
    done: counted.filter((item) => item.status === ActionItemStatus.Completed)
      .length,
    total: counted.length,
  };
}

const DAY_MS = 86_400_000;

/** "Bugün", "Yarın", or "12 Eyl" for anything further out. */
export function meetingDayLabel(startsAt: string, now = new Date()) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.floor(
    (Date.parse(startsAt) - startOfToday.getTime()) / DAY_MS,
  );
  if (days === 0) return "Bugün";
  if (days === 1) return "Yarın";
  return formatShortDate(startsAt);
}

/** "Yarın · 14:00 · 45 dk · Online" for the next meeting banner. */
export function meetingWhenLabel(meeting: MeetingItem, now = new Date()) {
  const time = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(meeting.scheduledAt));
  return [
    meetingDayLabel(meeting.scheduledAt, now),
    time,
    meeting.durationMinutes ? `${meeting.durationMinutes} dk` : null,
    "Online",
  ]
    .filter(Boolean)
    .join(" · ");
}

export type MentorTodayAction = {
  id: string;
  icon: "star" | "paper";
  startup: string;
  detail: string;
  chip: string | null;
  action: string;
  href: string;
};

/**
 * The single "Bugün aksiyon bekleyen" list: meetings the mentor still has to
 * write up, then the open work, with anything overdue flagged.
 */
export function mentorTodayActions(
  awaitingReview: MeetingItem[],
  openActionItems: ActionItem[],
  now = new Date(),
): MentorTodayAction[] {
  const meetingRows = awaitingReview.map((meeting) => ({
    id: meeting.id,
    icon: "star" as const,
    startup: meeting.organizationName ?? "Mentorluk",
    detail: `${meeting.agenda ?? "Mentorluk görüşmesi"} · değerlendirme bekliyor`,
    chip: null,
    action: "Değerlendir",
    href: mentorMeetingEvaluationHref(meeting.id),
  }));
  const itemRows = openActionItems.map((item) => {
    const overdue = isOverdueActionItem(item, now);
    return {
      id: item.id,
      icon: "paper" as const,
      startup: item.organizationName ?? "Mentorluk",
      detail: item.title,
      chip: overdue ? "Gecikti" : null,
      action: overdue ? "Hatırlat" : "Aç",
      href: "/mentorships",
    };
  });
  return [...meetingRows, ...itemRows];
}

export type MentorshipFileRow = {
  id: string;
  title: string;
  detail: string;
  status: "Yüklendi" | "Bekliyor";
};

/** A requested file, shown as uploaded once the startup has answered it. */
export function mentorshipFileRow(
  item: DocumentRequestItem,
): MentorshipFileRow {
  const upload = item.uploads.at(-1);
  if (upload) {
    return {
      id: item.id,
      title: upload.originalFilename,
      detail: `${upload.uploadedByName} yükledi · ${formatFileSize(upload.sizeBytes)} · ${formatShortDate(upload.createdAt)}`,
      status: "Yüklendi",
    };
  }
  return {
    id: item.id,
    title: item.title,
    detail: `${item.createdByName} talep etti · ${formatShortDate(item.createdAt)}`,
    status: "Bekliyor",
  };
}

/** A finished meeting with nothing written down still needs the mentor. */
export function meetingsAwaitingReview(
  meetings: MeetingItem[],
  now = new Date(),
) {
  return meetings
    .filter((meeting) => {
      if (meeting.status === MeetingStatus.Cancelled) return false;
      if (Date.parse(meeting.scheduledAt) >= now.getTime()) return false;
      return !meeting.outcomes?.trim() || !meeting.notes?.trim();
    })
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
}
