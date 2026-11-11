import type { MeetingItem } from "@/interfaces/meeting";
import {
  MeetingProposalStatus,
  type MeetingProposal,
} from "@/interfaces/meeting-proposal";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import type { OrganizationMember } from "@/interfaces/organization-member";
import {
  parsePreferredSlotsFromMessage,
  preferredSlotStartsAt,
} from "@/lib/mentor-availability-days";
import { mobileClock, type MobileTexts } from "@/lib/mobile";
import {
  dayHeading,
  MobileAgendaKind,
  startsInLabel,
  type MobileAgendaEntry,
} from "@/lib/mobile-calendar";
import { meetingTitle } from "@/lib/mobile-home";
import { mentorMeetingSummary } from "@/lib/mobile-mentor-home";
import { initials } from "@/lib/utils";

export type MentorEntryDetail = {
  title: string;
  startsIn: string | null;
  timeLine: string;
  timeHint: string;
  startup: { name: string; initials: string; people: string };
  self: { name: string; initials: string };
  topic: { title: string; agenda: string | null };
};

function requestFor(meeting: MeetingItem, requests: MentorshipRequest[]) {
  return requests.find((request) => request.id === meeting.mentorshipRequestId);
}

function startupName(
  meeting: MeetingItem,
  t: MobileTexts["t"],
  request?: MentorshipRequest,
) {
  return (
    meeting.organizationName ??
    request?.organizationName ??
    t("meeting.startup")
  );
}

/** Mentors see each meeting by the startup: "Döngü", "Positioning · Gülse Buran · Online". */
export function mentorAgendaEntries(
  entries: MobileAgendaEntry[],
  requests: MentorshipRequest[],
  texts: MobileTexts,
): MobileAgendaEntry[] {
  return entries.map((entry) => {
    const meeting = entry.meeting;
    if (!meeting) return entry;
    const request = requestFor(meeting, requests);
    const name = startupName(meeting, texts.t, request);
    return {
      ...entry,
      title: name,
      detail: [
        request
          ? texts.topicLabel(request.supportArea)
          : meetingTitle(meeting, texts.t),
        request?.requesterName,
        meeting.meetLink ? texts.t("meeting.online") : null,
      ]
        .filter(Boolean)
        .join(" · "),
      startup: { name, initials: initials(name) },
    };
  });
}

// The request dialog books 45 minutes when the mentor's slot length is unknown.
const REQUEST_MINUTES = 45;
const MINUTE_MS = 60_000;

function awaitingEntry(
  input: {
    id: string;
    startsAt: Date;
    minutes: number;
    startupName: string;
    topic: string;
    requestId?: string | undefined;
  },
  { t, locale }: MobileTexts,
): MobileAgendaEntry {
  return {
    id: input.id,
    kind: MobileAgendaKind.Meeting,
    startsAt: input.startsAt,
    endsAt: new Date(input.startsAt.getTime() + input.minutes * MINUTE_MS),
    time: mobileClock(input.startsAt, locale),
    length: t("calendar.minutes", { minutes: input.minutes }),
    title: input.startupName,
    detail: t("calendar.awaitingDetail", { topic: input.topic }),
    meeting: null,
    event: null,
    startup: { name: input.startupName, initials: initials(input.startupName) },
    awaitingApproval: true,
    requestId: input.requestId,
  };
}

/** Times still waiting for the mentor: proposals they have not answered and new requests' preferred slots. */
export function mentorAwaitingEntries(
  proposals: MeetingProposal[],
  requests: MentorshipRequest[],
  texts: MobileTexts,
  now: Date,
): MobileAgendaEntry[] {
  const { t } = texts;
  const fromProposals = proposals
    .filter(
      (proposal) =>
        proposal.status === MeetingProposalStatus.Pending &&
        proposal.canRespond,
    )
    .map((proposal) =>
      awaitingEntry(
        {
          id: `proposal:${proposal.id}`,
          startsAt: new Date(proposal.scheduledAt),
          minutes: proposal.durationMinutes,
          startupName: proposal.organizationName,
          topic: proposal.agenda?.trim() || t("calendar.proposalTopic"),
        },
        texts,
      ),
    );
  const fromRequests = requests
    .filter((request) => request.status === MentorshipRequestStatus.Pending)
    .flatMap((request) =>
      parsePreferredSlotsFromMessage(request.requesterMessage).flatMap(
        (slot) => {
          const startsAt = preferredSlotStartsAt(slot);
          if (!startsAt) return [];
          return [
            awaitingEntry(
              {
                id: `request:${request.id}:${startsAt}`,
                startsAt: new Date(startsAt),
                minutes: REQUEST_MINUTES,
                startupName: request.organizationName ?? t("meeting.startup"),
                topic: texts.topicLabel(request.supportArea),
                requestId: request.id,
              },
              texts,
            ),
          ];
        },
      ),
    );
  return [...fromProposals, ...fromRequests].filter(
    (entry) => entry.endsAt > now,
  );
}

// The founder leads; otherwise whoever asked for the mentorship.
function startupPeople(
  members: OrganizationMember[],
  t: MobileTexts["t"],
  request?: MentorshipRequest,
) {
  const lead =
    members.find((member) => member.founder)?.fullName ??
    request?.requesterName ??
    members[0]?.fullName;
  const others = members.filter((member) => member.fullName !== lead).length;
  if (!lead) return others > 0 ? t("calendar.members", { count: others }) : "";
  return others > 0
    ? t("calendar.leadAndMembers", { lead, count: others })
    : t("calendar.lead", { lead });
}

export function mentorEntryDetail(input: {
  entry: MobileAgendaEntry;
  meetings: MeetingItem[];
  requests: MentorshipRequest[];
  members: OrganizationMember[];
  mentorName: string;
  texts: MobileTexts;
  now: Date;
}): MentorEntryDetail | null {
  const { entry, now, texts } = input;
  const { t, locale } = texts;
  const meeting = entry.meeting;
  if (!meeting) return null;
  const request = requestFor(meeting, input.requests);
  const name = startupName(meeting, t, request);
  const day = dayHeading(entry.startsAt, now, texts).split(" · ")[0];
  return {
    title: request
      ? `${name} · ${texts.topicLabel(request.supportArea)}`
      : name,
    startsIn: entry.endsAt > now ? startsInLabel(entry, now, t) : null,
    timeLine: `${day} · ${mobileClock(entry.startsAt, locale)}–${mobileClock(entry.endsAt, locale)}`,
    timeHint: entry.length,
    startup: {
      name,
      initials: initials(name),
      people: startupPeople(input.members, t, request),
    },
    self: { name: input.mentorName, initials: initials(input.mentorName) },
    topic: {
      title: mentorMeetingSummary(
        meeting,
        input.meetings,
        input.requests,
        input.texts,
        now,
      ).detail,
      agenda: meeting.agenda?.trim()
        ? t("calendar.agendaLine", { agenda: meeting.agenda.trim() })
        : null,
    },
  };
}
