import { ActionItemStatus, type ActionItem } from "@/interfaces/action-item";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { MobileConversationKind } from "@/interfaces/mobile";
import type { OrganizationMember } from "@/interfaces/organization-member";
import type { Program } from "@/interfaces/program";
import type { RegularMentorship } from "@/interfaces/regular-mentorship";
import type { StartupDocument } from "@/interfaces/startup-document";
import { mentorRequestStartupHref } from "@/lib/mentorship-workspace";
import {
  MOBILE_CALENDAR,
  MOBILE_STARTUPS,
  mobileChatHref,
  mobileClock,
  webHref,
  type MobileTexts,
} from "@/lib/mobile";
import { meetingDayAndTime } from "@/lib/mobile-home";
import { endOf, programNameFor, upcomingFor } from "@/lib/mobile-mentor-home";
import { formatLongDate, initials } from "@/lib/utils";

export enum StartupHealth {
  Active = "active",
  Attention = "attention",
  Past = "past",
}

/** A startup with no planned meeting and none held for this long needs a nudge. */
export const QUIET_DAYS_FOR_ATTENTION = 7;
const PAST_MENTORSHIP_STATUSES = new Set(["COMPLETED", "CANCELLED"]);
const DAY_MS = 86_400_000;

export type StartupCard = {
  id: string;
  name: string;
  initials: string;
  program: string | null;
  health: StartupHealth;
  nextLine: string;
  href: string;
};

export function startupHref(organizationId: string) {
  return `${MOBILE_STARTUPS}/${encodeURIComponent(organizationId)}`;
}

function latestAccepted(requests: MentorshipRequest[], organizationId: string) {
  return (
    requests
      .filter(
        (request) =>
          request.organizationId === organizationId &&
          request.status === MentorshipRequestStatus.Accepted,
      )
      .sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      )[0] ?? null
  );
}

function daysSinceLastMeeting(
  meetings: MeetingItem[],
  organizationId: string,
  now: Date,
) {
  const held = meetings
    .filter(
      (meeting) =>
        meeting.organizationId === organizationId &&
        meeting.status !== MeetingStatus.Cancelled &&
        endOf(meeting) <= now.getTime(),
    )
    .map((meeting) => endOf(meeting));
  if (held.length === 0) return null;
  return Math.floor((now.getTime() - Math.max(...held)) / DAY_MS);
}

function activeCard(
  request: MentorshipRequest,
  meetings: MeetingItem[],
  programs: Program[],
  mentorId: string,
  texts: MobileTexts,
  now: Date,
): StartupCard {
  const { t } = texts;
  const name =
    request.organizationName ?? request.requesterName ?? t("meeting.startup");
  const topic = texts.topicLabel(request.supportArea);
  const next = upcomingFor(meetings, request.organizationId, now);
  let nextLine: string;
  let health = StartupHealth.Active;
  if (next) {
    const when = meetingDayAndTime(next, texts.locale, now);
    nextLine = `${when.day} · ${when.time} · ${topic}`;
  } else {
    const quietDays = daysSinceLastMeeting(
      meetings,
      request.organizationId,
      now,
    );
    const quiet =
      quietDays === null
        ? t("startups.noMeetingYet")
        : t("startups.quietDays", { days: quietDays });
    nextLine = `${t("startups.notPlanned")} · ${quiet} · ${topic}`;
    if (quietDays === null || quietDays >= QUIET_DAYS_FOR_ATTENTION) {
      health = StartupHealth.Attention;
    }
  }
  return {
    id: request.organizationId,
    name,
    initials: initials(name),
    program: programNameFor(programs, request.organizationId, mentorId),
    health,
    nextLine,
    href: startupHref(request.organizationId),
  };
}

/** The mentor's own startups only: those with an accepted mentorship, attention first. */
export function activeStartupCards(
  requests: MentorshipRequest[],
  meetings: MeetingItem[],
  programs: Program[],
  mentorId: string,
  texts: MobileTexts,
  now = new Date(),
) {
  const organizationIds = [
    ...new Set(
      requests
        .filter(
          (request) => request.status === MentorshipRequestStatus.Accepted,
        )
        .map((request) => request.organizationId),
    ),
  ];
  return organizationIds
    .flatMap((id) => {
      const request = latestAccepted(requests, id);
      return request
        ? [activeCard(request, meetings, programs, mentorId, texts, now)]
        : [];
    })
    .sort(
      (left, right) =>
        Number(right.health === StartupHealth.Attention) -
        Number(left.health === StartupHealth.Attention),
    );
}

/** Regular mentorships that ended, for startups the mentor no longer works with. */
export function pastStartupCards(
  mentorships: RegularMentorship[],
  activeIds: Set<string>,
  { t, locale }: MobileTexts,
): StartupCard[] {
  const seen = new Set<string>();
  return (
    mentorships
      .filter(
        (mentorship) =>
          PAST_MENTORSHIP_STATUSES.has(mentorship.status.toUpperCase()) &&
          !activeIds.has(mentorship.organizationId),
      )
      .filter((mentorship) => {
        if (seen.has(mentorship.organizationId)) return false;
        seen.add(mentorship.organizationId);
        return true;
      })
      // A student's personal team is never shown as a startup.
      .flatMap((mentorship) =>
        mentorship.organizationName === null
          ? []
          : [{ ...mentorship, organizationName: mentorship.organizationName }],
      )
      .map((mentorship) => ({
        id: mentorship.organizationId,
        name: mentorship.organizationName,
        initials: initials(mentorship.organizationName),
        program: null,
        health: StartupHealth.Past,
        nextLine: mentorship.endDate
          ? t("startups.endedOn", {
              date: formatLongDate(mentorship.endDate, locale),
            })
          : t("startups.ended"),
        href: startupHref(mentorship.organizationId),
      }))
  );
}

export type StartupDetail = {
  card: StartupCard;
  chatHref: string;
  meetingsHref: string;
  upcoming: { when: string; detail: string } | null;
  info: { label: string; value: string }[];
  lead: { name: string; initials: string; title: string } | null;
  members: { initials: string[]; count: number; names: string[] };
  tasks: string;
  files: string;
  notesHref: string;
};

function relativeDays(value: string, now: Date, t: MobileTexts["t"]) {
  const at = new Date(value);
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime()) /
      DAY_MS,
  );
  if (days <= 0) return t("startups.ago.today");
  if (days === 1) return t("startups.ago.yesterday");
  return t("startups.ago.days", { days });
}

export function startupDetail(input: {
  organizationId: string;
  requests: MentorshipRequest[];
  meetings: MeetingItem[];
  programs: Program[];
  mentorId: string;
  members: OrganizationMember[];
  documents: StartupDocument[];
  actionItems: ActionItem[];
  /** The mentor's meeting frequency, already in the page's language. */
  frequencyLabel: string | null;
  texts: MobileTexts;
  now?: Date;
}): StartupDetail | null {
  const now = input.now ?? new Date();
  const { t, locale, topicLabel } = input.texts;
  const request = latestAccepted(input.requests, input.organizationId);
  if (!request) return null;
  const card = activeCard(
    request,
    input.meetings,
    input.programs,
    input.mentorId,
    input.texts,
    now,
  );
  const next = upcomingFor(input.meetings, input.organizationId, now);
  const ordinal = next
    ? input.meetings.filter(
        (meeting) =>
          meeting.organizationId === input.organizationId &&
          meeting.status !== MeetingStatus.Cancelled &&
          meeting.scheduledAt <= next.scheduledAt,
      ).length
    : 0;
  const lead =
    input.members.find((member) => member.founder) ?? input.members[0] ?? null;
  const others = input.members.filter((member) => member !== lead);
  const done = input.actionItems.filter(
    (item) => item.status === ActionItemStatus.Completed,
  ).length;
  const counted = input.actionItems.filter(
    (item) => item.status !== ActionItemStatus.Cancelled,
  ).length;
  const newestFile = input.documents
    .map((document) => document.createdAt)
    .sort()
    .at(-1);

  return {
    card,
    chatHref: mobileChatHref(MobileConversationKind.Mentorship, request.id),
    meetingsHref: next
      ? `${MOBILE_CALENDAR}?meeting=${encodeURIComponent(next.id)}`
      : MOBILE_CALENDAR,
    upcoming: next
      ? {
          when: `${meetingDayAndTime(next, locale, now).day} · ${mobileClock(
            new Date(next.scheduledAt),
            locale,
          )}–${mobileClock(new Date(endOf(next)), locale)}`,
          detail: [
            topicLabel(request.supportArea),
            t("meeting.ordinal", { ordinal }),
            next.meetLink ? t("meeting.online") : null,
          ]
            .filter(Boolean)
            .join(" · "),
        }
      : null,
    info: [
      { label: t("startups.topic"), value: topicLabel(request.supportArea) },
      {
        label: t("startups.started"),
        value: formatLongDate(request.createdAt, locale),
      },
      {
        label: t("startups.frequency"),
        value: input.frequencyLabel ?? t("startups.notSpecified"),
      },
    ],
    lead: lead
      ? {
          name: lead.fullName,
          initials: initials(lead.fullName),
          title: lead.jobTitle ?? "",
        }
      : null,
    members: {
      initials: others.slice(0, 3).map((member) => initials(member.fullName)),
      count: others.length,
      names: others.map((member) => member.fullName),
    },
    tasks:
      counted > 0
        ? t("startups.tasksDone", { done, total: counted })
        : t("startups.noTasks"),
    files:
      input.documents.length > 0 && newestFile
        ? t("startups.files", {
            count: input.documents.length,
            when: relativeDays(newestFile, now, t),
          })
        : t("startups.noFiles"),
    notesHref: webHref(mentorRequestStartupHref(request.id)),
  };
}
