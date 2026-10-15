import type {
  AnnouncementThread,
  ProgramAnnouncement,
} from "@/interfaces/program-announcement";

export const MAX_ANNOUNCEMENT_LENGTH = 2000;

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
