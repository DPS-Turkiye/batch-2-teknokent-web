import type {
  AdminMentorship,
  AdminOverview,
  AdminProgram,
  AdminStartup,
  AdminUser,
} from "@/interfaces/admin-overview";
import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import {
  ProgramMentorStatus,
  ProgramStatus,
  ProgramType,
} from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";

/** A permission can come on top of the primary role (an academic who also mentors), so `roles` decides when present. */
export function hasRole(user: AdminUser, role: UserRole) {
  return (user.roles ?? [user.role]).includes(role);
}

export function coordinatorsOf(data: AdminOverview) {
  return data.users.filter((user) => hasRole(user, UserRole.Coordinator));
}

export function mentorsOf(data: AdminOverview) {
  return data.users.filter((user) => hasRole(user, UserRole.Mentor));
}

export function pendingMentors(data: AdminOverview) {
  return mentorsOf(data).filter(
    (user) => user.status === UserAccountStatus.Pending,
  );
}

export function pendingMemberships(data: AdminOverview) {
  return data.programs.flatMap((program) =>
    program.mentors
      .filter((mentor) => mentor.status === ProgramMentorStatus.Pending)
      .map((mentor) => ({ ...mentor, programName: program.name })),
  );
}

export function startupsOf(data: AdminOverview): AdminStartup[] {
  const seen = new Set<string>();
  const rows: AdminStartup[] = [];
  for (const program of data.programs) {
    for (const startup of program.startups) {
      const key = `${startup.programId}:${startup.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(startup);
    }
  }
  return rows;
}

/** A mentorship counts in the program it was made in; one made before programs were recorded counts in each of its team's programs. */
export function countsInProgram(item: AdminMentorship, programId: string) {
  return item.programId == null || item.programId === programId;
}

/**
 * A mentorship belongs to the program it was made in, also after its team left that program (an admin moved it
 * to another one). One made before programs were recorded belongs to each program its team is in today.
 */
export function belongsToProgram(item: AdminMentorship, program: AdminProgram) {
  return item.programId == null
    ? program.startups.some((startup) => startup.id === item.organizationId)
    : item.programId === program.id;
}

export function mentorshipInPrograms(
  item: AdminMentorship,
  programs: AdminProgram[],
) {
  return programs.some((program) => belongsToProgram(item, program));
}

export function activeMentorshipFor(
  data: AdminOverview,
  startup: Pick<AdminStartup, "id" | "programId">,
) {
  return data.mentorships.find(
    (item) =>
      item.organizationId === startup.id &&
      countsInProgram(item, startup.programId) &&
      (item.status === MentorshipStatus.Active ||
        item.status === MentorshipStatus.Planned),
  );
}

export function unmatchedStartups(data: AdminOverview) {
  return startupsOf(data).filter(
    (startup) => !activeMentorshipFor(data, startup),
  );
}

export function daysSince(startDate: string, now = new Date()) {
  const start = new Date(`${startDate}T00:00:00`);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

export function needsAttention(item: AdminMentorship, now = new Date()) {
  if (item.status !== MentorshipStatus.Active) return false;
  if (item.daysSinceMeeting == null)
    return daysSince(item.startDate, now) >= 14;
  return item.daysSinceMeeting >= 14;
}

/** Every program the user coordinates, the ones they were added to in its settings included. */
export function programsForCoordinator(data: AdminOverview, userId: string) {
  return data.programs.filter((program) =>
    (
      program.coordinatorIds ??
      (program.coordinatorId ? [program.coordinatorId] : [])
    ).includes(userId),
  );
}

export function programForOrganization(
  data: AdminOverview,
  organizationId: string,
) {
  return data.programs.find((program) =>
    program.startups.some((startup) => startup.id === organizationId),
  );
}

export function programOfMentorship(
  data: AdminOverview,
  item: AdminMentorship,
) {
  const own =
    item.programId == null
      ? undefined
      : data.programs.find((program) => program.id === item.programId);
  return own ?? programForOrganization(data, item.organizationId);
}

/** Open programs the admin can still put the mentor into: ones they are not in yet, or only waiting for. */
export function assignableProgramsForMentor(
  data: AdminOverview,
  userId: string,
) {
  return data.programs.filter(
    (program) =>
      program.status === ProgramStatus.Active &&
      !program.mentors.some(
        (mentor) =>
          mentor.mentorId === userId &&
          mentor.status === ProgramMentorStatus.Accepted,
      ),
  );
}

/** Open startup programs a team can be moved to: every one except the program it is listed under. */
export function moveTargetsForStartup(
  data: AdminOverview,
  startup: Pick<AdminStartup, "programId">,
) {
  return data.programs.filter(
    (program) =>
      program.status === ProgramStatus.Active &&
      program.type === ProgramType.StartupMentoring &&
      program.id !== startup.programId,
  );
}

/** The programs the mentor is in or invited to; a program that turned them down is not one of them. */
export function programsForMentor(data: AdminOverview, userId: string) {
  return data.programs.filter((program) =>
    program.mentors.some(
      (mentor) =>
        mentor.mentorId === userId &&
        mentor.status !== ProgramMentorStatus.Rejected,
    ),
  );
}

/** Whether the mentor counts in the program's `acceptedMentorCount`. */
export function isAcceptedMentor(program: AdminProgram, userId: string) {
  return program.mentors.some(
    (mentor) =>
      mentor.mentorId === userId &&
      mentor.status === ProgramMentorStatus.Accepted,
  );
}

/**
 * Whether the admin can take the mentor out of the program: only a mentor it accepted, and only in a
 * startup-mentoring program. An open invitation is taken back from the program's mentor pool instead.
 */
export function canRemoveMentorFromProgram(
  program: AdminProgram,
  userId: string,
) {
  return (
    program.type === ProgramType.StartupMentoring &&
    isAcceptedMentor(program, userId)
  );
}

/** The admin user list opened on the program's coordinator, or the whole list when it has none. */
export function coordinatorUsersHref(
  program: Pick<AdminProgram, "coordinatorId"> | null | undefined,
) {
  return program?.coordinatorId
    ? `/admin/users?user=${encodeURIComponent(program.coordinatorId)}`
    : "/admin/users";
}
