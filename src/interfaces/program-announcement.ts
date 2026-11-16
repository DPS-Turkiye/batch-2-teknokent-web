/** Who a coordinator's announcement is for; mirrors the backend's `AnnouncementAudience`. */
export enum AnnouncementAudience {
  Everyone = "EVERYONE",
  Mentors = "MENTORS",
  /** The program's teams; in an individual program (İŞKUR) its participants. */
  Participants = "PARTICIPANTS",
}

/** A coordinator's program announcement ("Duyurular"). */
export type ProgramAnnouncement = {
  id: string;
  programId: string;
  programName: string | null;
  authorName: string | null;
  body: string;
  createdAt: string;
  audience: AnnouncementAudience;
  /** The program's teams are single participants, named "katılımcılar" instead of "takımlar". */
  individualProgram: boolean;
  /** Who this announcement reaches today; the group its audience leaves out counts 0. */
  teamCount: number;
  mentorCount: number;
};

export type PostProgramAnnouncementInput = {
  body: string;
  audience: AnnouncementAudience;
};

/** One program's announcements, newest first, as a read-only thread. */
export type AnnouncementThread = {
  programId: string;
  programName: string;
  individualProgram: boolean;
  latest: ProgramAnnouncement | null;
  announcements: ProgramAnnouncement[];
};
