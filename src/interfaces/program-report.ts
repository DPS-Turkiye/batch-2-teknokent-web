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

/** Which side of the meeting wrote a feedback: its mentor, or someone from the mentored team. */
export enum MeetingFeedbackSide {
  Mentor = "MENTOR",
  Mentee = "MENTEE",
}

/** One post-meeting feedback in the program report: who rated whom, for which meeting. */
export type ProgramMeetingFeedback = {
  id: string;
  meetingAt: string;
  meetingTitle: string | null;
  mentorName: string | null;
  organizationName: string;
  authorName: string;
  side: MeetingFeedbackSide;
  /** Mentee: in the order of MEETING_FEEDBACK_QUESTIONS. Mentor: preparedness, then outcome clarity. */
  ratings: number[];
  qualities: string[];
  /** The free-text note; null when none was written. */
  note: string | null;
  submittedAt: string;
};

export enum SessionsExportFormat {
  Csv = "CSV",
  Xlsx = "XLSX",
}

/** One mentor, or one team (in an individual program, one student). */
export type ProgramSessionsRow = {
  id: string;
  name: string | null;
  /** A team lists every member, comma-separated. */
  email: string | null;
  sessions: number;
  minutes: number;
  days: number;
};

/** Meetings the mentors confirmed as held between two yyyy-mm-dd days, both inclusive. */
export type ProgramSessions = {
  programId: string;
  from: string;
  to: string;
  mentors: ProgramSessionsRow[];
  students: ProgramSessionsRow[];
};
