import type { useTranslations } from "next-intl";

import {
  MeetingFeedbackSide,
  type ProgramMeetingFeedback,
  type ProgramMeetingRatings,
} from "@/interfaces/program-report";
import {
  MEETING_FEEDBACK_BENEFIT_IDS,
  MEETING_FEEDBACK_BENEFITS,
  MEETING_FEEDBACK_QUESTIONS,
} from "@/lib/const";
import {
  MENTOR_EVALUATION_QUALITIES,
  MENTOR_EVALUATION_QUALITY_IDS,
  MENTOR_EVALUATION_RATING_IDS,
  OUTCOME_CLARITY_RATINGS,
} from "@/lib/const/mentor-evaluation";
import type { OutcomeClarity } from "@/types/mentor-evaluation";

type MeetingFeedbackBenefitId = (typeof MEETING_FEEDBACK_BENEFIT_IDS)[number];
type MentorEvaluationQualityId = (typeof MENTOR_EVALUATION_QUALITY_IDS)[number];

/** "4,3" — one decimal, in the page's number format. */
export function formatRating(value: number | null | undefined, locale: string) {
  if (value == null) return "—";
  return value.toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Share of held meetings a mentee rated, 0–100; null when none were held. */
export function ratingResponseRate(ratings: ProgramMeetingRatings) {
  if (ratings.heldMeetingCount === 0) return null;
  return Math.round(
    (ratings.ratedMeetingCount / ratings.heldMeetingCount) * 100,
  );
}

/** The "Memnuniyet" KPI of the report. */
export function satisfactionKpi(
  ratings: ProgramMeetingRatings | undefined,
  t: ReturnType<typeof useTranslations<"meetingRatings">>,
  locale: string,
) {
  if (!ratings) return { value: "—", detail: t("loading") };
  if (ratings.average == null) {
    return {
      value: "—",
      detail: ratings.heldMeetingCount === 0 ? t("noMeetings") : t("noRatings"),
    };
  }
  return {
    value: `${formatRating(ratings.average, locale)}/5`,
    detail: t("ratedDetail", {
      rated: ratings.ratedMeetingCount,
      held: ratings.heldMeetingCount,
    }),
  };
}

export function ratingQuestionRows(ratings: ProgramMeetingRatings) {
  return MEETING_FEEDBACK_QUESTIONS.map((question, index) => ({
    id: question.id,
    average: ratings.questionAverages[index] ?? null,
  }));
}

type FeedbackQuestionKey =
  | `questions.${(typeof MEETING_FEEDBACK_QUESTIONS)[number]["id"]}`
  | `mentorQuestions.${(typeof MENTOR_EVALUATION_RATING_IDS)[number]}`;

export type FeedbackRatingRow = {
  labelKey: FeedbackQuestionKey;
  rating: number;
  /** The mentor's "outcome clear?" is a three-way choice stored as 5/3/1, not a grade. */
  clarity: OutcomeClarity | null;
};

const CLARITY_BY_RATING = new Map(
  Object.entries(OUTCOME_CLARITY_RATINGS).map(([clarity, rating]) => [
    rating,
    clarity as OutcomeClarity,
  ]),
);

/**
 * One feedback's answers with the `meetingRatings` message key of each question:
 * the two forms ask different questions, so the author's side picks the labels.
 * A 0 (question skipped) or an answer past the form's questions is left out.
 */
export function feedbackRatingRows(
  feedback: ProgramMeetingFeedback,
): FeedbackRatingRow[] {
  const mentor = feedback.side === MeetingFeedbackSide.Mentor;
  const keys: FeedbackQuestionKey[] = mentor
    ? MENTOR_EVALUATION_RATING_IDS.map((id) => `mentorQuestions.${id}` as const)
    : MEETING_FEEDBACK_QUESTIONS.map(
        (question) => `questions.${question.id}` as const,
      );
  return feedback.ratings.flatMap((rating, index) => {
    const labelKey = keys[index];
    if (!labelKey || rating < 1 || rating > 5) return [];
    const clarity =
      labelKey === "mentorQuestions.clarity"
        ? (CLARITY_BY_RATING.get(rating) ?? null)
        : null;
    return [{ labelKey, rating, clarity }];
  });
}

const MENTEE_QUALITY_IDS = new Map<string, MeetingFeedbackBenefitId>(
  MEETING_FEEDBACK_BENEFITS.map((text, index) => [
    text,
    MEETING_FEEDBACK_BENEFIT_IDS[index],
  ]),
);
const MENTOR_QUALITY_IDS = new Map<string, MentorEvaluationQualityId>(
  MENTOR_EVALUATION_QUALITIES.map((text, index) => [
    text,
    MENTOR_EVALUATION_QUALITY_IDS[index],
  ]),
);

export type FeedbackQuality =
  | { text: string; menteeId: MeetingFeedbackBenefitId }
  | { text: string; mentorId: MentorEvaluationQualityId }
  | { text: string };

/**
 * The qualities are saved as Turkish text; this finds each one's message id in
 * the author's form so the list can show it in the page's language. An unknown
 * text keeps only its saved wording.
 */
export function feedbackQualities(
  feedback: ProgramMeetingFeedback,
): FeedbackQuality[] {
  return feedback.qualities.map((text) => {
    if (feedback.side === MeetingFeedbackSide.Mentor) {
      const mentorId = MENTOR_QUALITY_IDS.get(text);
      return mentorId ? { text, mentorId } : { text };
    }
    const menteeId = MENTEE_QUALITY_IDS.get(text);
    return menteeId ? { text, menteeId } : { text };
  });
}
