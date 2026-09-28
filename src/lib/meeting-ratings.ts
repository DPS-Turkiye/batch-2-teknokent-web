import type { ProgramMeetingRatings } from "@/interfaces/program-report";
import { MEETING_FEEDBACK_QUESTIONS } from "@/lib/const";

/** "4,3" — one decimal, Turkish comma. */
export function formatRating(value: number | null | undefined) {
  if (value == null) return "—";
  return value.toLocaleString("tr-TR", {
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
export function satisfactionKpi(ratings: ProgramMeetingRatings | undefined) {
  if (!ratings) return { value: "—", detail: "yükleniyor" };
  if (ratings.average == null) {
    return {
      value: "—",
      detail:
        ratings.heldMeetingCount === 0
          ? "bu pencerede görüşme yok"
          : "henüz değerlendirme yok",
    };
  }
  return {
    value: `${formatRating(ratings.average)}/5`,
    detail: `${ratings.ratedMeetingCount}/${ratings.heldMeetingCount} görüşme değerlendirildi`,
  };
}

export function ratingQuestionRows(ratings: ProgramMeetingRatings) {
  return MEETING_FEEDBACK_QUESTIONS.map((question, index) => ({
    label: question.short,
    prompt: question.prompt,
    average: ratings.questionAverages[index] ?? null,
  }));
}
