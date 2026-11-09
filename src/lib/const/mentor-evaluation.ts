import { OutcomeClarity } from "@/types/mentor-evaluation";

export const MENTOR_EVALUATION_QUESTION_COUNT = 3;

/** The two 1–5 ratings the mentor form saves, in order (see evaluationPayload). */
export const MENTOR_EVALUATION_RATING_IDS = [
  "preparedness",
  "clarity",
] as const;

/** Saved as the review's benefits, so the Turkish text is what gets stored. */
export const MENTOR_EVALUATION_QUALITIES = [
  "Hazırlıklı",
  "Açık iletişim",
  "Net sorular sordu",
  "Geri bildirime açık",
  "Aktif katılım",
  "Odaklı",
  "Yapıcı",
  "Çözüm odaklı",
  "Motivasyonu yüksek",
  "Saygılı",
] as const;

/** The `mentorEvaluation.quality` key of each quality above, in the same order. */
export const MENTOR_EVALUATION_QUALITY_IDS = [
  "prepared",
  "clear",
  "questions",
  "feedback",
  "active",
  "focused",
  "constructive",
  "solutions",
  "motivated",
  "respectful",
] as const;

export const OUTCOME_CLARITY_OPTIONS = [
  OutcomeClarity.Yes,
  OutcomeClarity.Partly,
  OutcomeClarity.No,
];

/** Stored as the second 1–5 rating, so "Kısmen" sits in the middle of the scale. */
export const OUTCOME_CLARITY_RATINGS: Record<OutcomeClarity, number> = {
  [OutcomeClarity.Yes]: 5,
  [OutcomeClarity.Partly]: 3,
  [OutcomeClarity.No]: 1,
};

export const MENTOR_EVALUATION_NOTE_MAX_LENGTH = 255;
