import type { useTranslations } from "next-intl";

import {
  AnnouncementAudience,
  type AnnouncementThread,
  type ProgramAnnouncement,
} from "@/interfaces/program-announcement";

export const MAX_ANNOUNCEMENT_LENGTH = 2000;

/** The "Kime?" choices, in the order the composer lists them. */
export const ANNOUNCEMENT_AUDIENCES = [
  AnnouncementAudience.Everyone,
  AnnouncementAudience.Mentors,
  AnnouncementAudience.Participants,
] as const;

type AnnouncementsT = ReturnType<typeof useTranslations<"announcements">>;

/** A viewer's announcements (newest first) as one thread per program, newest thread first. */
export function announcementThreads(
  announcements: ProgramAnnouncement[],
): AnnouncementThread[] {
  const byProgram = new Map<string, AnnouncementThread>();
  for (const announcement of announcements) {
    const thread = byProgram.get(announcement.programId) ?? {
      programId: announcement.programId,
      programName: announcement.programName ?? "Program",
      individualProgram: announcement.individualProgram,
      latest: announcement,
      announcements: [],
    };
    thread.announcements.push(announcement);
    byProgram.set(announcement.programId, thread);
  }
  return [...byProgram.values()];
}

/** "Herkes", "Yalnızca mentorlar", or "Yalnızca takımlar" ("katılımcılar" in an individual program). */
export function audienceName(
  audience: AnnouncementAudience,
  individualProgram: boolean,
  t: AnnouncementsT,
) {
  switch (audience) {
    case AnnouncementAudience.Mentors:
      return t("to.mentors");
    case AnnouncementAudience.Participants:
      return individualProgram ? t("to.participants") : t("to.teams");
    case AnnouncementAudience.Everyone:
      return t("to.everyone");
  }
}

export function audienceOptions(individualProgram: boolean, t: AnnouncementsT) {
  return ANNOUNCEMENT_AUDIENCES.map((audience) => ({
    id: audience,
    label: audienceName(audience, individualProgram, t),
  }));
}

/** Who an announcement went to and how many it reaches today: "Yalnızca mentorlar · 28 mentor". */
export function audienceSummary(
  announcement: ProgramAnnouncement,
  t: AnnouncementsT,
) {
  const teams = announcement.individualProgram
    ? t("reach.participants", { count: announcement.teamCount })
    : t("reach.teams", { count: announcement.teamCount });
  const mentors = t("reach.mentors", { count: announcement.mentorCount });
  return t("summary", {
    audience: audienceName(
      announcement.audience,
      announcement.individualProgram,
      t,
    ),
    reach: audienceReach(announcement.audience, { teams, mentors }, t),
  });
}

function audienceReach(
  audience: AnnouncementAudience,
  counts: { teams: string; mentors: string },
  t: AnnouncementsT,
) {
  switch (audience) {
    case AnnouncementAudience.Mentors:
      return counts.mentors;
    case AnnouncementAudience.Participants:
      return counts.teams;
    case AnnouncementAudience.Everyone:
      return t("reach.both", counts);
  }
}
