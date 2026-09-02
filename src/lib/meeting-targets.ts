import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { ProgramMentorStatus, type Program } from "@/interfaces/program";

export type MeetingTarget = {
  key: string;
  organizationId: string;
  organizationName: string;
  subtitle: string;
  requesterName?: string;
  mentorshipRequestId?: string;
  programId?: string;
};

export function programsMentorHasJoined(
  programs: Program[],
  mentorId: string | undefined,
) {
  if (!mentorId) return [];
  return programs.filter((program) =>
    program.mentors.some(
      (mentor) =>
        mentor.mentorId === mentorId &&
        mentor.status === ProgramMentorStatus.Accepted,
    ),
  );
}

export function meetingTargetLabel(target: MeetingTarget) {
  return [target.organizationName, target.requesterName]
    .filter(Boolean)
    .join(" · ");
}

export function meetingRecipient(target: MeetingTarget): {
  mentorshipRequestId?: string;
  programId?: string;
  organizationId?: string;
} {
  if (target.mentorshipRequestId) {
    return { mentorshipRequestId: target.mentorshipRequestId };
  }
  return {
    programId: target.programId,
    organizationId: target.organizationId,
  };
}

export function groupMeetingTargets(
  mentorships: MentorshipRequest[],
  programs: Program[],
): {
  byProgram: { program: Program; items: MeetingTarget[] }[];
  ungrouped: MeetingTarget[];
} {
  const byProgram = programs
    .map((program) => ({
      program,
      items: program.startups.map((startup): MeetingTarget => {
        const mentorship = mentorships.find(
          (item) => item.organizationId === startup.id,
        );
        return {
          key: mentorship?.id ?? `program:${program.id}:${startup.id}`,
          organizationId: startup.id,
          organizationName: startup.name,
          requesterName: mentorship?.requesterName,
          subtitle: mentorship?.supportArea ?? program.name,
          mentorshipRequestId: mentorship?.id,
          programId: program.id,
        };
      }),
    }))
    .filter((group) => group.items.length > 0);

  const claimed = new Set(
    byProgram.flatMap((group) =>
      group.items.map((item) => item.organizationId),
    ),
  );

  const ungrouped: MeetingTarget[] = mentorships
    .filter((mentorship) => !claimed.has(mentorship.organizationId))
    .map((mentorship) => ({
      key: mentorship.id,
      organizationId: mentorship.organizationId,
      organizationName: mentorship.organizationName ?? "",
      requesterName: mentorship.requesterName,
      subtitle: mentorship.supportArea,
      mentorshipRequestId: mentorship.id,
    }));

  return { byProgram, ungrouped };
}
