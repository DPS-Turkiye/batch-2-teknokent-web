import type {
  AdminMentorship,
  AdminOverview,
  AdminStartup,
} from "@/interfaces/admin-overview";

export function coordinatorsOf(data: AdminOverview) {
  return data.users.filter((user) => user.role === "COORDINATOR");
}

export function mentorsOf(data: AdminOverview) {
  return data.users.filter((user) => user.role === "MENTOR");
}

export function pendingMentors(data: AdminOverview) {
  return mentorsOf(data).filter((user) => user.status === "PENDING");
}

export function pendingMemberships(data: AdminOverview) {
  return data.programs.flatMap((program) =>
    program.mentors
      .filter((mentor) => mentor.status === "PENDING")
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

export function activeMentorshipFor(
  data: AdminOverview,
  organizationId: string,
) {
  return data.mentorships.find(
    (item) =>
      item.organizationId === organizationId &&
      (item.status === "ACTIVE" || item.status === "PLANNED"),
  );
}

export function unmatchedStartups(data: AdminOverview) {
  return startupsOf(data).filter(
    (startup) => !activeMentorshipFor(data, startup.id),
  );
}

export function daysSince(startDate: string, now = new Date()) {
  const start = new Date(`${startDate}T00:00:00`);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

export function needsAttention(item: AdminMentorship, now = new Date()) {
  if (item.status !== "ACTIVE") return false;
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

export function programsForMentor(data: AdminOverview, userId: string) {
  return data.programs.filter((program) =>
    program.mentors.some((mentor) => mentor.mentorId === userId),
  );
}
