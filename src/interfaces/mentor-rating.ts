/** The average of every 1–5 answer mentees gave in meeting feedback; null before the first one. */
export type MentorRating = {
  average: number | null;
  feedbackCount: number;
  mentorships: {
    mentorshipRequestId: string;
    average: number;
    feedbackCount: number;
  }[];
};
