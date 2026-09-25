import type { MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import type { OrganizationMember } from "@/interfaces/organization-member";
import {
  dayHeading,
  startsInLabel,
  type MobileAgendaEntry,
} from "@/lib/mobile-calendar";
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
        request?.supportArea ?? meetingTitle(meeting),
        request?.requesterName,
        meeting.meetLink ? "Online" : null,
      ]
        .filter(Boolean)
        .join(" · "),
      startup: { name, initials: initials(name) },
    };
  });
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
      title: mentorMeetingSummary(meeting, input.meetings, input.requests, now)
        .detail,
      agenda: meeting.agenda?.trim()
        ? `Gündem: ${meeting.agenda.trim()}`
        : null,
    },
  };
}
