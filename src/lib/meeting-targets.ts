import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import type { RegularMentorship } from "@/interfaces/regular-mentorship";
import { ProgramMentorStatus, type Program } from "@/interfaces/program";

export type MeetingTarget = {
  key: string;
  organizationId: string;
  organizationName: string;
  subtitle: string;
  requesterName?: string;
  mentorshipRequestId?: string;
  programId?: string;
  regularMentorshipId?: string;
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
  regularMentorships: RegularMentorship[] = [],
): {
  byProgram: { program: Program; items: MeetingTarget[] }[];
  regular: MeetingTarget[];
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

  const regular: MeetingTarget[] = regularMentorships.map((item) => ({
    key: `regular:${item.id}`,
    organizationId: item.organizationId,
    organizationName: item.organizationName,
    subtitle: `Haftada ${item.daysPerWeek} gün · Düzenli`,
    regularMentorshipId: item.id,
  }));

  for (const item of regular) {
    claimed.add(item.organizationId);
  }

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

  return { byProgram, regular, ungrouped };
}

export function unusedMeetingTargets(
  mentorships: MentorshipRequest[],
  programs: Program[],
  peerOrganizationIds: Iterable<string>,
) {
  const taken = new Set(peerOrganizationIds);
  const grouped = groupMeetingTargets(mentorships, programs);
  return {
    ungrouped: grouped.ungrouped.filter(
      (target) => !taken.has(target.organizationId),
    ),
    byProgram: grouped.byProgram
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !taken.has(item.organizationId)),
      }))
      .filter((group) => group.items.length > 0),
  };
}

export function unusedProgramMentors(
  programs: Program[],
  peerMentorIds: Iterable<string>,
) {
  const taken = new Set(peerMentorIds);
  const mentors = new Map<string, string>();
  for (const program of programs) {
    for (const mentor of program.mentors) {
      if (mentor.status !== ProgramMentorStatus.Accepted) continue;
      if (!mentor.mentorId || taken.has(mentor.mentorId)) continue;
      if (!mentor.fullName.trim()) continue;
      mentors.set(mentor.mentorId, mentor.fullName);
    }
  }
  return [...mentors.entries()].map(([mentorId, fullName]) => ({
    mentorId,
    fullName,
  }));
}
