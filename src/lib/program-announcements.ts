import type {
  AnnouncementThread,
  ProgramAnnouncement,
} from "@/interfaces/program-announcement";

export const MAX_ANNOUNCEMENT_LENGTH = 2000;

/** "METU Stars 2026 — Duyuru" */
export function announcementThreadName(programName: string) {
  return `${programName} — Duyuru`;
}

/** "42 takım · 28 mentor" */
export function audienceLabel(announcement: ProgramAnnouncement | null) {
  return announcement
    ? `${announcement.teamCount} takım · ${announcement.mentorCount} mentor`
    : "Henüz duyuru yok";
}

/** A viewer's announcements (newest first) as one thread per program, newest thread first. */
export function announcementThreads(
  announcements: ProgramAnnouncement[],
): AnnouncementThread[] {
  const byProgram = new Map<string, AnnouncementThread>();
  for (const announcement of announcements) {
    const thread = byProgram.get(announcement.programId) ?? {
      programId: announcement.programId,
      programName: announcement.programName ?? "Program",
      latest: announcement,
      announcements: [],
    };
    thread.announcements.push(announcement);
    byProgram.set(announcement.programId, thread);
  }
  return [...byProgram.values()];
}
