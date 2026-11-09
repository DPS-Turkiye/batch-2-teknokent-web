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
