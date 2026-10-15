import type { MeetingItem } from "@/interfaces/meeting";
import {
  type MeetingProposal,
  MeetingProposalStatus,
} from "@/interfaces/meeting-proposal";
import {
  type MentorshipRequest,
  MentorshipRequestStatus,
} from "@/interfaces/mentorship-request";
import type { OrganizationMember } from "@/interfaces/organization-member";
import {
  parsePreferredSlotsFromMessage,
  preferredSlotStartsAt,
} from "@/lib/mentor-availability-days";
import {
  dayHeading,
  MobileAgendaKind,
  startsInLabel,
  type MobileAgendaEntry,
} from "@/lib/mobile-calendar";
import type { MobileTexts } from "@/lib/mobile";
import { meetingTitle } from "@/lib/mobile-home";
import { mentorMeetingSummary } from "@/lib/mobile-mentor-home";
import { initials } from "@/lib/utils";

const time = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
});

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

function startupName(meeting: MeetingItem, request?: MentorshipRequest) {
  return meeting.organizationName ?? request?.organizationName ?? "Startup";
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
    const name = startupName(meeting, request);
    return {
      ...entry,
      title: name,
      detail: [
        request?.supportArea ?? meetingTitle(meeting, texts.t),
        request?.requesterName,
        meeting.meetLink ? "Online" : null,
      ]
        .filter(Boolean)
        .join(" · "),
      startup: { name, initials: initials(name) },
    };
  });
}

export const AWAITING_APPROVAL_LABEL = "Onay bekliyor";

// The request dialog books 45 minutes when the mentor's slot length is unknown.
const REQUEST_MINUTES = 45;
const MINUTE_MS = 60_000;

function awaitingEntry(input: {
  id: string;
  startsAt: Date;
  minutes: number;
  startupName: string;
  topic: string;
  requestId?: string;
}): MobileAgendaEntry {
  return {
    id: input.id,
    kind: MobileAgendaKind.Meeting,
    startsAt: input.startsAt,
    endsAt: new Date(input.startsAt.getTime() + input.minutes * MINUTE_MS),
    time: time.format(input.startsAt),
    length: `${input.minutes} dk`,
    title: input.startupName,
    detail: `${input.topic} · önerilen saat · onay bekliyor`,
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
  now: Date,
): MobileAgendaEntry[] {
  const fromProposals = proposals
    .filter(
      (proposal) =>
        proposal.status === MeetingProposalStatus.Pending &&
        proposal.canRespond,
    )
    .map((proposal) =>
      awaitingEntry({
        id: `proposal:${proposal.id}`,
        startsAt: new Date(proposal.scheduledAt),
        minutes: proposal.durationMinutes,
        startupName: proposal.organizationName,
        topic: proposal.agenda?.trim() || "Görüşme önerisi",
      }),
    );
  const fromRequests = requests
    .filter((request) => request.status === MentorshipRequestStatus.Pending)
    .flatMap((request) =>
      parsePreferredSlotsFromMessage(request.requesterMessage).flatMap(
        (slot) => {
          const startsAt = preferredSlotStartsAt(slot);
          if (!startsAt) return [];
          return [
            awaitingEntry({
              id: `request:${request.id}:${startsAt}`,
              startsAt: new Date(startsAt),
              minutes: REQUEST_MINUTES,
              startupName: request.organizationName ?? "Startup",
              topic: request.supportArea,
              requestId: request.id,
            }),
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
  request?: MentorshipRequest,
) {
  const lead =
    members.find((member) => member.founder)?.fullName ??
    request?.requesterName ??
    members[0]?.fullName;
  const others = members.filter((member) => member.fullName !== lead).length;
  if (!lead) return others > 0 ? `${others} üye` : "";
  return others > 0 ? `${lead} (yetkili) + ${others} üye` : `${lead} (yetkili)`;
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
  const { entry, now } = input;
  const meeting = entry.meeting;
  if (!meeting) return null;
  const request = requestFor(meeting, input.requests);
  const name = startupName(meeting, request);
  const day = dayHeading(entry.startsAt, now).split(" · ")[0];
  return {
    title: request ? `${name} · ${request.supportArea}` : name,
    startsIn: entry.endsAt > now ? startsInLabel(entry, now) : null,
    timeLine: `${day} · ${time.format(entry.startsAt)}–${time.format(entry.endsAt)}`,
    timeHint: entry.length,
    startup: {
      name,
      initials: initials(name),
      people: startupPeople(input.members, request),
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
        ? `Gündem: ${meeting.agenda.trim()}`
        : null,
    },
  };
}
