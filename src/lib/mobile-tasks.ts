import { ActionItemStatus, type ActionItem } from "@/interfaces/action-item";
import {
  ProgramEventKind,
  type MemberProgramEvent,
} from "@/interfaces/coordinator-program";
import type { MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import {
  MobileConversationKind,
  MobileTaskSource,
  MobileTaskTone,
  type MobileTask,
  type MobileTaskGroup,
} from "@/interfaces/mobile";
import type { ProcessAssignment } from "@/interfaces/startup-process";
import { HOME_TASK_LABELS } from "@/lib/const/mentee-home";
import { meetingEndedAt } from "@/lib/mentee-home";
import { meetingFeedbackHref } from "@/lib/mentorship-workspace";
import { mobileChatHref, webHref } from "@/lib/mobile";
import { calendarDay } from "@/lib/utils";

const DAY_MS = 86_400_000;
const PROCESS_WEB_PATH = "/startup/process";

const dayMonth = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
});

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayOffset(day: Date, today: Date) {
  return Math.round(
    (startOfDay(day).getTime() - startOfDay(today).getTime()) / DAY_MS,
  );
}

/** "Dün", "Bugün", "Yarın", then "25 Eylül"; null for a task without a date. */
export function dueLabel(dueAt: Date | null, today: Date) {
  if (!dueAt) return "Tarih yok";
  const offset = dayOffset(dueAt, today);
  if (offset === -1) return "Dün";
  if (offset === 0) return "Bugün";
  if (offset === 1) return "Yarın";
  return dayMonth.format(dueAt);
}

export function dueTone(dueAt: Date | null, today: Date) {
  if (!dueAt) return MobileTaskTone.Later;
  const offset = dayOffset(dueAt, today);
  if (offset < 0) return MobileTaskTone.Overdue;
  if (offset === 0) return MobileTaskTone.Today;
  return MobileTaskTone.Later;
}

function isDone(status: ActionItemStatus) {
  return status === ActionItemStatus.Completed;
}

function isOpen(status: ActionItemStatus) {
  return (
    status === ActionItemStatus.Open || status === ActionItemStatus.InProgress
  );
}

function withDue(
  task: Omit<MobileTask, "dueLabel" | "tone" | "meta">,
  who: string | null,
  today: Date,
): MobileTask {
  const label = dueLabel(task.dueAt, today);
  return {
    ...task,
    dueLabel: label,
    tone: dueTone(task.dueAt, today),
    meta: who ? `${label} · ${who}` : label,
  };
}

/** A mentorship task, with the mentor who set it and a way to message them. */
export function mentorshipTask(
  item: ActionItem,
  request: MentorshipRequest,
  today: Date,
): MobileTask {
  return withDue(
    {
      id: `action:${item.id}`,
      source: MobileTaskSource.Mentorship,
      title: item.title,
      description: item.description ?? null,
      dueAt: item.dueDate ? calendarDay(item.dueDate) : null,
      assignedBy: request.mentorName,
      assignedOn: dayMonth.format(new Date(item.createdAt)),
      chips: [`${request.supportArea} mentorluğu`],
      completed: isDone(item.status),
      requestId: request.id,
      chatHref: mobileChatHref(MobileConversationKind.Mentorship, request.id),
      webHref: null,
    },
    request.mentorName,
    today,
  );
}

/** A startup-process assignment; it is handed in with a file, on the web. */
export function processTask(
  assignment: ProcessAssignment,
  today: Date,
): MobileTask {
  return withDue(
    {
      id: `process:${assignment.id}`,
      source: MobileTaskSource.Process,
      title: assignment.title,
      description: assignment.description,
      dueAt: assignment.dueDate ? calendarDay(assignment.dueDate) : null,
      assignedBy: assignment.createdByName,
      assignedOn: dayMonth.format(new Date(assignment.createdAt)),
      chips: ["Süreç görevi"],
      completed: isDone(assignment.status),
      requestId: null,
      chatHref: null,
      webHref: webHref(PROCESS_WEB_PATH),
    },
    assignment.createdByName,
    today,
  );
}

export function programDeadlineTask(
  event: MemberProgramEvent,
  today: Date,
): MobileTask {
  return withDue(
    {
      id: `program:${event.id}`,
      source: MobileTaskSource.Program,
      title: event.title,
      description: event.description,
      dueAt: new Date(event.startsAt),
      assignedBy: null,
      assignedOn: null,
      chips: [event.programName],
      completed: false,
      requestId: null,
      chatHref: null,
      webHref: null,
    },
    event.programName,
    today,
  );
}

/** A held meeting still waiting for the mentee's rating; it is rated on the web. */
export function meetingFeedbackTask(
  meeting: MeetingItem,
  today: Date,
): MobileTask {
  const mentor = meeting.mentorName ?? null;
  return withDue(
    {
      id: `feedback:${meeting.id}`,
      source: MobileTaskSource.Feedback,
      title: HOME_TASK_LABELS.feedbackTitle,
      description: null,
      dueAt: new Date(meetingEndedAt(meeting)),
      assignedBy: mentor,
      assignedOn: null,
      chips: [meeting.agenda?.trim() || "Mentorluk görüşmesi"],
      completed: false,
      requestId: meeting.mentorshipRequestId ?? null,
      chatHref: null,
      webHref: webHref(meetingFeedbackHref(meeting.id)),
    },
    mentor,
    today,
  );
}

export function collectTasks(
  input: {
    actionItemsByRequest: { request: MentorshipRequest; items: ActionItem[] }[];
    assignments: ProcessAssignment[];
    deadlines: MemberProgramEvent[];
    feedbackMeetings: MeetingItem[];
  },
  today: Date,
) {
  // A Süreç assignment is also an action item; keep the process version.
  const processIds = new Set(input.assignments.map((item) => item.id));
  return [
    ...input.actionItemsByRequest.flatMap(({ request, items }) =>
      items
        .filter(
          (item) =>
            !processIds.has(item.id) &&
            (isOpen(item.status) || isDone(item.status)),
        )
        .map((item) => mentorshipTask(item, request, today)),
    ),
    ...input.assignments
      .filter((item) => isOpen(item.status) || isDone(item.status))
      .map((item) => processTask(item, today)),
    ...input.deadlines
      .filter(
        (event) =>
          event.kind === ProgramEventKind.Deadline &&
          new Date(event.startsAt) >= startOfDay(today),
      )
      .map((event) => programDeadlineTask(event, today)),
    ...input.feedbackMeetings.map((meeting) =>
      meetingFeedbackTask(meeting, today),
    ),
  ];
}

function byDue(left: MobileTask, right: MobileTask) {
  return (
    (left.dueAt?.getTime() ?? Number.POSITIVE_INFINITY) -
    (right.dueAt?.getTime() ?? Number.POSITIVE_INFINITY)
  );
}

/** Gecikmiş, Bugün, Bu hafta, Daha sonra, then meeting ratings and program deadlines on their own. */
export function groupOpenTasks(
  tasks: MobileTask[],
  today: Date,
): MobileTaskGroup[] {
  const open = tasks.filter((task) => !task.completed).sort(byDue);
  const own = open.filter(
    (task) =>
      task.source !== MobileTaskSource.Program &&
      task.source !== MobileTaskSource.Feedback,
  );
  const daysToSunday = 6 - ((today.getDay() + 6) % 7);
  const within = (task: MobileTask, from: number, to: number) => {
    if (!task.dueAt) return false;
    const offset = dayOffset(task.dueAt, today);
    return offset >= from && offset <= to;
  };
  const groups: MobileTaskGroup[] = [
    {
      key: "overdue",
      label: "Gecikmiş",
      urgent: true,
      tasks: own.filter((task) => task.tone === MobileTaskTone.Overdue),
    },
    {
      key: "today",
      label: "Bugün",
      urgent: false,
      tasks: own.filter((task) => task.tone === MobileTaskTone.Today),
    },
    {
      key: "week",
      label: "Bu hafta",
      urgent: false,
      tasks: own.filter((task) => within(task, 1, daysToSunday)),
    },
    {
      key: "later",
      label: "Daha sonra",
      urgent: false,
      tasks: own.filter(
        (task) => !task.dueAt || dayOffset(task.dueAt, today) > daysToSunday,
      ),
    },
    {
      key: "feedback",
      label: "Değerlendirmeler",
      urgent: false,
      tasks: open.filter((task) => task.source === MobileTaskSource.Feedback),
    },
    {
      key: "program",
      label: "Program",
      urgent: false,
      tasks: open.filter((task) => task.source === MobileTaskSource.Program),
    },
  ];
  return groups.filter((group) => group.tasks.length > 0);
}

export function completedTasks(tasks: MobileTask[]) {
  return tasks
    .filter((task) => task.completed)
    .sort(byDue)
    .reverse();
}
