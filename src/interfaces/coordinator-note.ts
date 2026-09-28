/** A note on a mentorship that only the program's coordinators see. */
export type CoordinatorNote = {
  id: string;
  mentorshipId: string;
  authorName: string | null;
  body: string;
  createdAt: string;
  /** The viewer wrote it, so they may delete it. */
  mine: boolean;
};
