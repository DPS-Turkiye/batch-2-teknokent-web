import type { ActionItem } from "@/interfaces/action-item";
import type { MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { requestHasConfirmedMeeting } from "@/lib/mentorship-workspace";
import { calendarDay } from "@/lib/utils";
import { DueTone, HomeTaskKind, SentRequestState } from "@/types/mentee-home";

const DAY_MS = 86_400_000;

const DUE_TONE_LABELS = {
  [DueTone.Overdue]: "Gecikti",
  [DueTone.Today]: "Bugün",
  [DueTone.None]: "Tarih yok",
} satisfies Record<Exclude<DueTone, DueTone.Upcoming>, string>;

export const SENT_REQUEST_STATE_LABELS: Record<SentRequestState, string> = {
  [SentRequestState.ActionNeeded]: "Aksiyon gerekli",
  [SentRequestState.MentorReviewing]: "Mentor inceliyor",
};

// A request only lands in Yapılacaklar when the mentee has to move next.
const REQUEST_TASK_LABELS: Partial<Record<MentorshipRequestStatus, string>> = {
  [MentorshipRequestStatus.MoreInfoRequested]: "Bilgi bekliyor",
  [MentorshipRequestStatus.CounterProposed]: "Saat önerisi",
  [MentorshipRequestStatus.Accepted]: "Saat seç",
};

const TONE_ORDER: Record<DueTone, number> = {
  [DueTone.Overdue]: 0,
  [DueTone.Today]: 1,
  [DueTone.Upcoming]: 2,
  [DueTone.None]: 3,
};

const dayMonth = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
});
const dayMonthYear = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const hourMinute = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
});

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

export function dayGreeting(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return "Günaydın";
  if (hour >= 12 && hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

export function dueState(dueDate: string | null | undefined, now = new Date()) {
  const day = dueDate ? dueDay(dueDate) : null;
  if (!day || Number.isNaN(day.getTime())) {
    return { tone: DueTone.None, label: DUE_TONE_LABELS[DueTone.None] };
  }
  const offset = dayOffset(day, now);
  if (offset < 0) {
    return { tone: DueTone.Overdue, label: DUE_TONE_LABELS[DueTone.Overdue] };
  }
  if (offset === 0) {
    return { tone: DueTone.Today, label: DUE_TONE_LABELS[DueTone.Today] };
  }
  return { tone: DueTone.Upcoming, label: dayMonth.format(day) };
}

export function meetingWhenLabel(meeting: MeetingItem, now = new Date()) {
  const start = new Date(meeting.scheduledAt);
  const offset = dayOffset(start, now);
  const day =
    offset === 0 ? "Bugün" : offset === 1 ? "Yarın" : dayMonth.format(start);
  const parts = [
    day,
    hourMinute.format(start),
    `${meeting.durationMinutes} dk`,
  ];
  if (meeting.meetLink) parts.push("Online");
  return parts.join(" · ");
}

export function meetingDayLabel(meeting: MeetingItem) {
  return dayMonthYear.format(new Date(meeting.scheduledAt));
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
};

/** Yapılacaklar: requests waiting on the mentee plus open action items, most urgent first. */
export function buildHomeTasks({
  requests,
  meetings,
  actionItems,
  actionItemRequestIds,
  now = new Date(),
}: {
  requests: MentorshipRequest[];
  meetings: MeetingItem[];
  actionItems: ActionItem[];
  actionItemRequestIds: Record<string, string>;
  now?: Date;
}): HomeTask[] {
  const requestsById = new Map(
    requests.map((request) => [request.id, request]),
  );

  const replies = requests
    .filter((request) => requestNeedsMenteeAction(request, meetings))
    .map((request) => ({
      // An empty key puts a reply ahead of action items due the same day.
      sortKey: "",
      task: {
        id: `request-${request.id}`,
        kind: HomeTaskKind.RequestReply,
        title: "Mentor talebini yanıtla",
        subtitle: `${request.mentorName} · ${request.supportArea}`,
        dueTone: DueTone.Today,
        dueLabel: REQUEST_TASK_LABELS[request.status] ?? "",
        actionLabel: "Yanıtla",
        href: requestStatusHref(request.id),
      },
    }));

  const items = actionItems.map((item) => {
    const requestId = actionItemRequestIds[item.id];
    const request = requestId ? requestsById.get(requestId) : undefined;
    const due = dueState(item.dueDate, now);
    return {
      sortKey: item.dueDate ?? "",
      task: {
        id: `action-${item.id}`,
        kind: HomeTaskKind.ActionItem,
        title: item.title,
        subtitle: [
          request?.mentorName ?? item.ownerName,
          request?.supportArea ?? "Mentorluk görevi",
        ]
          .filter(Boolean)
          .join(" · "),
        dueTone: due.tone,
        dueLabel: due.label,
        actionLabel: "Görevi aç",
        href: requestId ? requestStatusHref(requestId) : "/mentorships",
      },
    };
  });

  return [...replies, ...items]
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
) {
  if (openActionCount > 0) {
    return { hasOpenActions: true, label: `${openActionCount} açık aksiyon` };
  }
  if (nextMeeting) {
    return {
      hasOpenActions: false,
      label: `Sonraki görüşme · ${dayMonth.format(new Date(nextMeeting.scheduledAt))}`,
    };
  }
  return { hasOpenActions: false, label: "Planlı görüşme yok" };
}
