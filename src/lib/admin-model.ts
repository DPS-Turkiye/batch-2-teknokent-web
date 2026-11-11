import type {
  AdminMentorship,
  AdminOverview,
  AdminProgram,
  AdminStartup,
} from "@/interfaces/admin-overview";
import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import { ProgramMentorStatus, ProgramStatus } from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";

export function coordinatorsOf(data: AdminOverview) {
  return data.users.filter((user) => user.role === UserRole.Coordinator);
}

export function approvedCoordinatorsOf(data: AdminOverview) {
  return coordinatorsOf(data).filter(
    (user) => user.status === UserAccountStatus.Approved,
  );
}

export function mentorsOf(data: AdminOverview) {
  return data.users.filter((user) => user.role === UserRole.Mentor);
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

export function mentorshipInPrograms(
  item: AdminMentorship,
  programs: AdminProgram[],
) {
  return programs.some(
    (program) =>
      countsInProgram(item, program.id) &&
      program.startups.some((startup) => startup.id === item.organizationId),
  );
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

export function programsForCoordinator(data: AdminOverview, userId: string) {
  return data.programs.filter((program) => program.coordinatorId === userId);
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

/** Open programs the startup is not in yet. */
export function assignableProgramsForStartup(
  data: AdminOverview,
  organizationId: string,
) {
  return data.programs.filter(
    (program) =>
      program.status === ProgramStatus.Active &&
      !program.startups.some((startup) => startup.id === organizationId),
  );
}

export function programsForMentor(data: AdminOverview, userId: string) {
  return data.programs.filter((program) =>
    program.mentors.some((mentor) => mentor.mentorId === userId),
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
