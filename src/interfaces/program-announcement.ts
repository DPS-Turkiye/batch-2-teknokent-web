/** A coordinator's program-wide announcement ("Duyurular"). */
export type ProgramAnnouncement = {
  id: string;
  programId: string;
  programName: string | null;
  authorName: string | null;
  body: string;
  createdAt: string;
  /** Who the program's announcements reach today. */
  teamCount: number;
  mentorCount: number;
};

/** One program's announcements, newest first, as a read-only thread. */
export type AnnouncementThread = {
  programId: string;
  programName: string;
  latest: ProgramAnnouncement | null;
  announcements: ProgramAnnouncement[];
};
