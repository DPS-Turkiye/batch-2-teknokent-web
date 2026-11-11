import type { useTranslations } from "next-intl";

import { ActionItemStatus, type ActionItem } from "@/interfaces/action-item";
import type { DocumentRequestItem } from "@/interfaces/document-request";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { formatMeetingShort } from "@/lib/format";
import { mentorMeetingEvaluationHref } from "@/lib/mentor-evaluation";
import { isMeetingEnded } from "@/lib/mentorship-workspace";
import { formatFileSize, formatShortDate, relativeDayLabel } from "@/lib/utils";

/** The mentor home's translator and language, for the labels built here. */
export type MentorHomeTexts = {
  t: ReturnType<typeof useTranslations<"mentorHome">>;
  locale: string;
};

/** A past meeting is the last one, not the next one. */
export function conversationMeetingLabel(
  meeting: MeetingItem | null,
  { t, locale }: MentorHomeTexts,
  now = new Date(),
) {
  if (!meeting) return null;
  const when = formatMeetingShort(meeting.scheduledAt, locale);
  return isMeetingEnded(meeting, now)
    ? t("lastMeeting", { when })
    : t("nextMeeting", { when });
}

/** Monday-to-Sunday in the browser's zone. */
export function mentorWeekMeetingCount(
  meetings: MeetingItem[],
  now = new Date(),
) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const endDay = new Date(start);
  endDay.setDate(endDay.getDate() + 7);
  const end = endDay.getTime();
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
export function meetingDayLabel(
  startsAt: string,
  locale: string,
  now = new Date(),
) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.floor(
    (Date.parse(startsAt) - startOfToday.getTime()) / DAY_MS,
  );
  if (days === 0 || days === 1) return relativeDayLabel(days, locale);
  return formatShortDate(startsAt, locale);
}

/** "Yarın · 14:00 · 45 dk · Online" for the next meeting banner. */
export function meetingWhenLabel(
  meeting: MeetingItem,
  { t, locale }: MentorHomeTexts,
  now = new Date(),
) {
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(meeting.scheduledAt));
  return [
    meetingDayLabel(meeting.scheduledAt, locale, now),
    time,
    meeting.durationMinutes
      ? t("minutes", { count: meeting.durationMinutes })
      : null,
    t("online"),
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
  { t }: Pick<MentorHomeTexts, "t">,
  now = new Date(),
): MentorTodayAction[] {
  const meetingRows = awaitingReview.map((meeting) => ({
    id: meeting.id,
    icon: "star" as const,
    startup: meeting.organizationName ?? t("fallback.mentorship"),
    detail: t("today.awaitingReview", {
      agenda: meeting.agenda ?? t("fallback.meeting"),
    }),
    chip: null,
    action: t("today.evaluate"),
    href: mentorMeetingEvaluationHref(meeting.id),
  }));
  const itemRows = openActionItems.map((item) => {
    const overdue = isOverdueActionItem(item, now);
    return {
      id: item.id,
      icon: "paper" as const,
      startup: item.organizationName ?? t("fallback.mentorship"),
      detail: item.title,
      chip: overdue ? t("today.overdue") : null,
      action: overdue ? t("today.remind") : t("today.open"),
      href: "/mentorships",
    };
  });
  return [...meetingRows, ...itemRows];
}

export type MentorshipFileRow = {
  id: string;
  title: string;
  detail: string;
  uploaded: boolean;
  status: string;
};

/** A requested file, shown as uploaded once the startup has answered it. */
export function mentorshipFileRow(
  item: DocumentRequestItem,
  { t, locale }: MentorHomeTexts,
): MentorshipFileRow {
  const upload = item.uploads.at(-1);
  if (upload) {
    return {
      id: item.id,
      title: upload.originalFilename,
      detail: t("files.uploadedBy", {
        name: upload.uploadedByName,
        size: formatFileSize(upload.sizeBytes),
        date: formatShortDate(upload.createdAt, locale),
      }),
      uploaded: true,
      status: t("files.uploaded"),
    };
  }
  return {
    id: item.id,
    title: item.title,
    detail: t("files.requestedBy", {
      name: item.createdByName,
      date: formatShortDate(item.createdAt, locale),
    }),
    uploaded: false,
    status: t("files.waiting"),
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
