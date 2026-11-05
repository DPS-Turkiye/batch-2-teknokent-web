import type { useTranslations } from "next-intl";

import type { ActionItem } from "@/interfaces/action-item";
import type { MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { HOME_TASK_DISMISS_STORAGE_KEY } from "@/lib/const/mentee-home";
import {
  meetingFeedbackHref,
  requestHasConfirmedMeeting,
} from "@/lib/mentorship-workspace";
import { calendarDay } from "@/lib/utils";
import { DueTone, HomeTaskKind, SentRequestState } from "@/types/mentee-home";

const DAY_MS = 86_400_000;

/** The home page's translator and language, for the labels built here. */
export type HomeTexts = {
  t: ReturnType<typeof useTranslations<"menteeHome">>;
  locale: string;
};

// A request only lands in Yapılacaklar when the mentee has to move next.
type RequestTaskStatus =
  | MentorshipRequestStatus.MoreInfoRequested
  | MentorshipRequestStatus.CounterProposed
  | MentorshipRequestStatus.Accepted;

const TONE_ORDER: Record<DueTone, number> = {
  [DueTone.Overdue]: 0,
  [DueTone.Today]: 1,
  [DueTone.Upcoming]: 2,
  [DueTone.None]: 3,
};

function dayMonth(locale: string, date: Date) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
  }).format(date);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayOffset(date: Date, now: Date) {
  return Math.round(
    (startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS,
  );
}

// A bare date is a calendar day; a full timestamp is read in the viewer's own day.
function dueDay(value: string) {
  return value.length > 10 ? startOfDay(new Date(value)) : calendarDay(value);
}

export function dueState(
  dueDate: string | null | undefined,
  { t, locale }: HomeTexts,
  now = new Date(),
) {
  const day = dueDate ? dueDay(dueDate) : null;
  if (!day || Number.isNaN(day.getTime())) {
    return { tone: DueTone.None, label: t("tasks.due.none") };
  }
  const offset = dayOffset(day, now);
  if (offset < 0) {
    return { tone: DueTone.Overdue, label: t("tasks.due.overdue") };
  }
  if (offset === 0) {
    return { tone: DueTone.Today, label: t("tasks.due.today") };
  }
  return { tone: DueTone.Upcoming, label: dayMonth(locale, day) };
}

export function meetingWhenLabel(
  meeting: MeetingItem,
  { t, locale }: HomeTexts,
  now = new Date(),
) {
  const start = new Date(meeting.scheduledAt);
  const offset = dayOffset(start, now);
  const day =
    offset === 0
      ? t("when.today")
      : offset === 1
        ? t("when.tomorrow")
        : dayMonth(locale, start);
  const parts = [
    day,
    new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(start),
    t("when.minutes", { count: meeting.durationMinutes }),
  ];
  if (meeting.meetLink) parts.push(t("when.online"));
  return parts.join(" · ");
}

export function meetingDayLabel(meeting: MeetingItem, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(meeting.scheduledAt));
}

export function requestStatusHref(requestId: string) {
  return `/mentor-request/status?id=${encodeURIComponent(requestId)}`;
}

export function requestNeedsMenteeAction(
  request: MentorshipRequest,
  meetings: MeetingItem[],
) {
  return (
    request.status === MentorshipRequestStatus.MoreInfoRequested ||
    request.status === MentorshipRequestStatus.CounterProposed ||
    (request.status === MentorshipRequestStatus.Accepted &&
      !requestHasConfirmedMeeting(meetings, request))
  );
}

export function sentRequestState(
  request: MentorshipRequest,
  meetings: MeetingItem[],
) {
  return requestNeedsMenteeAction(request, meetings)
    ? SentRequestState.ActionNeeded
    : SentRequestState.MentorReviewing;
}

export type HomeTask = {
  id: string;
  kind: HomeTaskKind;
  title: string;
  subtitle: string;
  dueTone: DueTone;
  dueLabel: string;
  actionLabel: string;
  href: string;
  requestId?: string;
};

export function homeTaskId(kind: HomeTaskKind, entityId: string) {
  if (kind === HomeTaskKind.RequestReply) return `request-${entityId}`;
  if (kind === HomeTaskKind.MeetingFeedback) return `feedback-${entityId}`;
  return `action-${entityId}`;
}

function dismissedStorageKey(userId: string) {
  return `${HOME_TASK_DISMISS_STORAGE_KEY}:${userId}`;
}

export function readDismissedHomeTasks(userId: string) {
  if (typeof window === "undefined") return [] as string[];
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(dismissedStorageKey(userId)) ?? "[]",
    ) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeDismissedHomeTasks(userId: string, ids: string[]) {
  window.localStorage.setItem(dismissedStorageKey(userId), JSON.stringify(ids));
}

export function meetingEndedAt(meeting: MeetingItem) {
  const start = new Date(meeting.scheduledAt).getTime();
  const durationMs = Math.max(1, meeting.durationMinutes || 60) * 60_000;
  return new Date(start + durationMs).toISOString();
}

export function buildHomeTasks({
  requests,
  meetings,
  actionItems,
  actionItemRequestIds,
  feedbackMeetings = [],
  dismissedTaskIds = [],
  texts,
  now = new Date(),
}: {
  requests: MentorshipRequest[];
  meetings: MeetingItem[];
  actionItems: ActionItem[];
  actionItemRequestIds: Record<string, string>;
  feedbackMeetings?: MeetingItem[];
  dismissedTaskIds?: string[];
  texts: HomeTexts;
  now?: Date;
}): HomeTask[] {
  const { t } = texts;
  const requestsById = new Map(
    requests.map((request) => [request.id, request]),
  );
  const hidden = new Set(dismissedTaskIds);

  const replies = requests
    .filter((request) => requestNeedsMenteeAction(request, meetings))
    .map((request) => ({
      sortKey: "",
      task: {
        id: homeTaskId(HomeTaskKind.RequestReply, request.id),
        kind: HomeTaskKind.RequestReply,
        title: t("tasks.replyTitle"),
        subtitle: `${request.mentorName} · ${request.supportArea}`,
        dueTone: DueTone.Today,
        dueLabel: t(
          `tasks.requestStatus.${request.status as RequestTaskStatus}`,
        ),
        actionLabel: t("tasks.reply"),
        href: requestStatusHref(request.id),
      },
    }));

  const items = actionItems.map((item) => {
    const requestId = actionItemRequestIds[item.id];
    const request = requestId ? requestsById.get(requestId) : undefined;
    const due = dueState(item.dueDate, texts, now);
    return {
      sortKey: item.dueDate ?? "",
      task: {
        id: homeTaskId(HomeTaskKind.ActionItem, item.id),
        kind: HomeTaskKind.ActionItem,
        title: item.title,
        subtitle: [
          request?.mentorName ?? item.ownerName,
          request?.supportArea ?? t("tasks.taskFallback"),
          item.previousOwnerName
            ? t("tasks.handedOver", { name: item.previousOwnerName })
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
        dueTone: due.tone,
        dueLabel: due.label,
        actionLabel: t("tasks.openTask"),
        href: requestId
          ? requestStatusHref(requestId)
          : item.ownerLeftAt
            ? "/startup/process"
            : "/mentorships",
        requestId,
      },
    };
  });

  const evaluations = feedbackMeetings.map((meeting) => {
    const request = meeting.mentorshipRequestId
      ? requestsById.get(meeting.mentorshipRequestId)
      : undefined;
    const endedAt = meetingEndedAt(meeting);
    const due = dueState(endedAt, texts, now);
    return {
      sortKey: endedAt,
      task: {
        id: homeTaskId(HomeTaskKind.MeetingFeedback, meeting.id),
        kind: HomeTaskKind.MeetingFeedback,
        title: t("tasks.feedbackTitle"),
        subtitle: [
          meeting.mentorName ?? request?.mentorName,
          meeting.agenda?.trim() ||
            request?.supportArea ||
            t("meetingFallback"),
        ]
          .filter(Boolean)
          .join(" · "),
        dueTone: due.tone,
        dueLabel: due.label,
        actionLabel: t("tasks.feedbackAction"),
        href: meetingFeedbackHref(meeting.id),
      },
    };
  });

  return [...replies, ...items, ...evaluations]
    .filter(({ task }) => !hidden.has(task.id))
    .sort(
      (left, right) =>
        TONE_ORDER[left.task.dueTone] - TONE_ORDER[right.task.dueTone] ||
        left.sortKey.localeCompare(right.sortKey),
    )
    .map(({ task }) => task);
}

export function activeMentorshipFooter(
  openActionCount: number,
  nextMeeting: MeetingItem | null,
  { t, locale }: HomeTexts,
) {
  if (openActionCount > 0) {
    return {
      hasOpenActions: true,
      label: t("active.openActions", { count: openActionCount }),
    };
  }
  if (nextMeeting) {
    return {
      hasOpenActions: false,
      label: t("active.nextMeeting", {
        date: dayMonth(locale, new Date(nextMeeting.scheduledAt)),
      }),
    };
  }
  return { hasOpenActions: false, label: t("active.noMeeting") };
}
