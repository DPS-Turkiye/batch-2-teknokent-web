/** The fixed palette a mentor label is drawn from; the backend stores only the key. */
export enum MentorLabelColor {
  Blue = "BLUE",
  Green = "GREEN",
  Purple = "PURPLE",
  Orange = "ORANGE",
  Red = "RED",
  Yellow = "YELLOW",
  Pink = "PINK",
  Teal = "TEAL",
  Indigo = "INDIGO",
  Gray = "GRAY",
}

export type MentorLabel = {
  id: string;
  name: string;
  color: MentorLabelColor;
};

/** A label in the coordinator's list, with how many mentors carry it. */
export type MentorLabelBoardLabel = MentorLabel & { mentorCount: number };

/** The labels one mentor carries in a program, in the program list's order. */
export type MentorLabelAssignment = {
  mentorId: string;
  labelIds: string[];
};

/** Mentor Havuzu's labels; both lists are empty while the program's switch is off. */
export type MentorLabelBoard = {
  enabled: boolean;
  /** False also for an archived program, whose labels stay visible. */
  editable: boolean;
  labels: MentorLabelBoardLabel[];
  mentors: MentorLabelAssignment[];
};

/** The labels a mentee sees on their own program's mentors; `programId` is null when there are none to show. */
export type MentorLabelDirectory = {
  programId: string | null;
  labels: MentorLabel[];
  mentors: MentorLabelAssignment[];
};

/** One program's labels on one mentor. */
export type MentorProgramLabels = {
  programId: string;
  programName: string;
  labels: MentorLabel[];
};

export type MentorLabelInput = {
  name: string;
  color: MentorLabelColor;
};
