import type { useTranslations } from "next-intl";

import type { ProgramMeetingRatings } from "@/interfaces/program-report";
import { MEETING_FEEDBACK_QUESTIONS } from "@/lib/const";

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
