import type { useTranslations } from "next-intl";

import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  MatchingMethod,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import type { Program } from "@/interfaces/program";
import { CALENDAR_SUPPORT_AREA } from "@/lib/const";
import { requestOutcomeFromMessage } from "@/lib/mentor-availability-days";

/** The meeting pages' translator and language, for the labels built here. */
export type MeetingContextTexts = {
  t: ReturnType<typeof useTranslations<"meetingPages.context">>;
  locale: string;
};

export function meetingCallHref(meetingId: string) {
  return `/meetings/research?id=${encodeURIComponent(meetingId)}`;
}

export function isCalendarOriginRequest(
  request: MentorshipRequest | null | undefined,
) {
  if (!request) return true;
  if (request.mentorMessage?.trim() === "Takvimden oluşturuldu") return true;
  const area = request.supportArea.trim();
  if (!area || area === CALENDAR_SUPPORT_AREA) return true;
  if (
    request.recommendationSnapshot?.matchingMethod === MatchingMethod.Profile
  ) {
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

export function meetingScheduleLabel(
  meeting: MeetingItem,
  { t, locale }: MeetingContextTexts,
  now = new Date(),
) {
  const start = new Date(meeting.scheduledAt);
  if (Number.isNaN(start.getTime())) return "";
  const end = new Date(
    start.getTime() + Math.max(1, meeting.durationMinutes || 60) * 60_000,
  );
  const sameDay = start.toDateString() === now.toDateString();
  const dayLabel = sameDay
    ? t("today")
    : new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(start);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const range = `${time.format(start)}–${time.format(end)}`;
  const status = meeting.status;
  const statusLabel =
    status === MeetingStatus.Completed
      ? t("completed")
      : status === MeetingStatus.Cancelled
        ? t("cancelled")
        : now.getTime() >= start.getTime() && now.getTime() <= end.getTime()
          ? t("started")
          : now.getTime() < start.getTime()
            ? t("planned")
            : t("expired");
  return `${dayLabel} · ${range} · ${statusLabel}`;
}

export function meetingCounterpartName(
  meeting: MeetingItem,
  request: MentorshipRequest | null | undefined,
  viewerIsMentor: boolean,
  { t }: MeetingContextTexts,
) {
  if (viewerIsMentor) {
    return (
      request?.organizationName ||
      meeting.organizationName ||
      request?.requestedForName ||
      request?.requesterName ||
      t("organization")
    );
  }
  return meeting.mentorName || request?.mentorName || t("mentor");
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
  // Requests sent before the field existed keep the outcome inside the message.
  return (
    request?.expectedOutcome?.trim() ||
    requestOutcomeFromMessage(request?.requesterMessage)
  );
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
      item.status === MeetingStatus.Completed,
  );
}

export function meetingInviteeLabels(
  room: MeetingItem[],
  { t }: MeetingContextTexts,
) {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const item of room) {
    const mentor = item.mentorName?.trim() || t("mentor");
    const org = item.organizationName?.trim() || t("startup");
    const label = `${mentor} · ${org}`;
    if (seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }
  return labels;
}
