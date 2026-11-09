/** One quiz question as its editors see it; the correct option is never sent to students. */
export type TrainingQuestionDraft = {
  text: string;
  options: [string, string, string, string];
  correctOption: number;
};

/** The peer program's Akran Mentoru training, for its editors (`GET …/training`). */
export type TrainingModuleForEditor = {
  published: boolean;
  version: number | null;
  videoId: string;
  updatedAt: string | null;
  /** Nothing saved yet: the clearly marked example video and questions. */
  placeholder: boolean;
  questions: TrainingQuestionDraft[];
};

export type SaveTrainingInput = {
  videoUrl: string;
  questions: TrainingQuestionDraft[];
};

export const TRAINING_QUESTION_COUNT = 10;
export const TRAINING_OPTION_COUNT = 4;

/** Where the student stands with their peer program's training (`GET /api/training/peer`). */
export enum TrainingState {
  NotAvailable = "NOT_AVAILABLE",
  Video = "VIDEO",
  Quiz = "QUIZ",
  BadgeActive = "BADGE_ACTIVE",
  /** Their badge was taken back; only a coordinator or admin can award it again. */
  Blocked = "BLOCKED",
}

export type StudentTraining = {
  state: TrainingState;
  programId: string | null;
  programName: string | null;
  version: number | null;
  videoId: string | null;
  videoWatched: boolean;
  attemptsLeft: number;
  nextAttemptAt: string | null;
  lastScore: number | null;
  passMark: number;
  questionCount: number;
};

/** One attempt's questions in a fresh order; an option is answered by its `index`. No correct answers. */
export type TrainingQuiz = {
  version: number;
  questions: {
    id: string;
    text: string;
    options: { index: number; text: string }[];
  }[];
};

export type TrainingAttemptResult = {
  score: number;
  passed: boolean;
  training: StudentTraining;
};
