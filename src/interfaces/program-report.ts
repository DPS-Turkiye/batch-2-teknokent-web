/** Mentees' post-meeting ratings for a program, as numbers only. Averages are null until someone rates. */
export type ProgramMeetingRatings = {
  programId: string;
  heldMeetingCount: number;
  ratedMeetingCount: number;
  feedbackCount: number;
  average: number | null;
  /** In the order of MEETING_FEEDBACK_QUESTIONS. */
  questionAverages: (number | null)[];
  /** How many answers were 1, 2, 3, 4 and 5. */
  distribution: number[];
};
