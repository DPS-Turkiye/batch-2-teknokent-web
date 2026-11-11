import type { MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import type { Program } from "@/interfaces/program";

export type MeetingParticipant = {
  label: string;
  name: string;
};

function addParticipant(
  rows: MeetingParticipant[],
  seen: Set<string>,
  label: string,
  name: string | null | undefined,
) {
  const trimmed = name?.trim();
  if (!trimmed) return;
  const key = `${label}:${trimmed.toLocaleLowerCase("tr")}`;
  if (seen.has(key)) return;
  seen.add(key);
  rows.push({ label, name: trimmed });
}

/** People and groups attached to a meeting, for the calendar detail dialog. */
export function describeMeetingParticipants(
  meeting: MeetingItem,
  options?: {
    mentorships?: MentorshipRequest[];
    programs?: Program[];
    peers?: MeetingItem[];
  },
): MeetingParticipant[] {
  const rows: MeetingParticipant[] = [];
  const seen = new Set<string>();
  const peers = options?.peers?.length ? options.peers : [meeting];

  for (const peer of peers) {
    addParticipant(rows, seen, "Startup", peer.organizationName);
    addParticipant(rows, seen, "Mentor", peer.mentorName);
  }

  for (const peer of peers) {
    const mentorship = options?.mentorships?.find(
      (item) => item.organizationId === peer.organizationId,
    );
    addParticipant(rows, seen, "Mentee", mentorship?.requesterName);
  }

  const orgIds = new Set(peers.map((peer) => peer.organizationId));
  for (const program of options?.programs ?? []) {
    if (!program.startups.some((startup) => orgIds.has(startup.id))) continue;
    addParticipant(rows, seen, "Program", program.name);
  }
  return rows;
}

export function meetingCalendarTitle(meeting: MeetingItem) {
  return meeting.organizationName || meeting.agenda || "Mentorluk görüşmesi";
}
