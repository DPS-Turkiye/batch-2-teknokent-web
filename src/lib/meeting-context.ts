import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import type { Program } from "@/interfaces/program";
import {
  CALENDAR_SUPPORT_AREA,
  MEETING_CONTEXT_DAY_TODAY,
  MEETING_CONTEXT_FALLBACKS,
  MEETING_CONTEXT_STATUS_LABELS,
} from "@/lib/const";
import { requestOutcomeFromMessage } from "@/lib/mentor-availability-days";

export function meetingCallHref(meetingId: string) {
  return `/meetings/research?id=${encodeURIComponent(meetingId)}`;
}

export function isCalendarOriginRequest(
  request: MentorshipRequest | null | undefined,
) {
  if (!request) return true;
  if (request.mentorMessage?.trim() === "Takvimden oluşturuldu") return true;
  const area = request.supportArea?.trim() ?? "";
  if (!area || area === CALENDAR_SUPPORT_AREA) return true;
  if (request.recommendationSnapshot?.matchingMethod === "PROFILE") {
    return false;
  }
  const summary = request.summary?.trim() ?? "";
  if (summary === `${area} — Mentorluk Görüşmesi`) return true;
  return Boolean(summary) && summary === area;
}

export function isProfileOriginRequest(
  request: MentorshipRequest | null | undefined,
) {
  if (!request) return false;
  return !isCalendarOriginRequest(request);
}

export function splitContextLines(value: string | null | undefined) {
  if (!value?.trim()) return [] as string[];
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•\d.)]+\s*/, "").trim())
    .filter(Boolean);
}

function istanbulDayKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export function meetingScheduleLabel(meeting: MeetingItem, now = new Date()) {
  const start = new Date(meeting.scheduledAt);
  if (Number.isNaN(start.getTime())) return "";
  const end = new Date(
    start.getTime() + Math.max(1, meeting.durationMinutes || 60) * 60_000,
  );
  const sameDay = istanbulDayKey(start) === istanbulDayKey(now);
  const dayLabel = sameDay
    ? MEETING_CONTEXT_DAY_TODAY
    : new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(start);
  const time = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
  });
  const range = `${time.format(start)}–${time.format(end)}`;
  const status = String(meeting.status).toUpperCase();
  const statusLabel =
    status === MeetingStatus.Completed
      ? MEETING_CONTEXT_STATUS_LABELS.completed
      : status === MeetingStatus.Cancelled
        ? MEETING_CONTEXT_STATUS_LABELS.cancelled
        : now.getTime() >= start.getTime() && now.getTime() <= end.getTime()
          ? MEETING_CONTEXT_STATUS_LABELS.started
          : now.getTime() < start.getTime()
            ? MEETING_CONTEXT_STATUS_LABELS.planned
            : MEETING_CONTEXT_STATUS_LABELS.expired;
  return `${dayLabel} · ${range} · ${statusLabel}`;
}

export function meetingCounterpartName(
  meeting: MeetingItem,
  request: MentorshipRequest | null | undefined,
  viewerIsMentor: boolean,
) {
  if (viewerIsMentor) {
    return (
      request?.organizationName ||
      meeting.organizationName ||
      request?.requestedForName ||
      request?.requesterName ||
      MEETING_CONTEXT_FALLBACKS.organization
    );
  }
  return (
    meeting.mentorName ||
    request?.mentorName ||
    MEETING_CONTEXT_FALLBACKS.mentor
  );
}

export function requestAgendaLines(
  request: MentorshipRequest | null | undefined,
  meeting: MeetingItem,
) {
  const fromSummary = splitContextLines(request?.summary);
  if (fromSummary.length > 0) return fromSummary;
  return splitContextLines(meeting.agenda);
}

export function requestExpectedOutcome(
  request: MentorshipRequest | null | undefined,
) {
  return requestOutcomeFromMessage(request?.requesterMessage);
}

export function programsForOrganization(
  programs: Program[] | undefined,
  organizationId: string,
) {
  if (!programs?.length) return [] as Program[];
  return programs.filter((program) =>
    program.startups.some((startup) => startup.id === organizationId),
  );
}

export function isFirstMeetingWithMentor(
  meetings: MeetingItem[],
  meeting: MeetingItem,
) {
  const mentorId = meeting.mentorId;
  const organizationId = meeting.organizationId;
  if (!mentorId) return true;
  return !meetings.some(
    (item) =>
      item.id !== meeting.id &&
      item.mentorId === mentorId &&
      item.organizationId === organizationId &&
      String(item.status).toUpperCase() === MeetingStatus.Completed,
  );
}

export function meetingInviteeLabels(room: MeetingItem[]) {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const item of room) {
    const mentor = item.mentorName?.trim() || MEETING_CONTEXT_FALLBACKS.mentor;
    const org =
      item.organizationName?.trim() || MEETING_CONTEXT_FALLBACKS.startup;
    const label = `${mentor} · ${org}`;
    if (seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }
  return labels;
}
