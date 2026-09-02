import type { MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { ProgramMentorStatus, type Program } from "@/interfaces/program";

export type MeetingParticipant = {
  label: string;
  name: string;
};

function addParticipant(
  rows: MeetingParticipant[],
  seen: Set<string>,
  label: string,
  name: string | undefined,
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
  },
): MeetingParticipant[] {
  const rows: MeetingParticipant[] = [];
  const seen = new Set<string>();

  addParticipant(rows, seen, "Startup", meeting.organizationName);
  addParticipant(rows, seen, "Mentor", meeting.mentorName);

  const mentorship = options?.mentorships?.find(
    (item) => item.organizationId === meeting.organizationId,
  );
  addParticipant(rows, seen, "Mentee", mentorship?.requesterName);

  const program = options?.programs?.find((item) =>
    item.startups.some((startup) => startup.id === meeting.organizationId),
  );
  if (!program) return rows;

  addParticipant(rows, seen, "Program", program.name);
  for (const mentor of program.mentors) {
    if (mentor.status !== ProgramMentorStatus.Accepted) continue;
    if (mentor.mentorId && mentor.mentorId === meeting.mentorId) continue;
    addParticipant(rows, seen, "Mentor", mentor.fullName);
  }
  return rows;
}

export function meetingCalendarTitle(meeting: MeetingItem) {
  return meeting.organizationName || meeting.agenda || "Mentorluk görüşmesi";
}
