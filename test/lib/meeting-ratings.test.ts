import { describe, expect, it } from "vitest";

import {
  MeetingFeedbackSide,
  type ProgramMeetingRatings,
} from "@/interfaces/program-report";
import { Locale } from "@/lib/i18n";
import {
  feedbackQualities,
  feedbackRatingRows,
  formatRating,
  ratingQuestionRows,
  ratingResponseRate,
  satisfactionKpi,
} from "@/lib/meeting-ratings";
import { OutcomeClarity } from "@/types/mentor-evaluation";
import { programMeetingFeedback } from "@test/fixtures/program-report";
import { translatorIn } from "@test/translators";

const t = translatorIn("tr", "meetingRatings");
const tEn = translatorIn("en", "meetingRatings");

function ratings(
  overrides: Partial<ProgramMeetingRatings> = {},
): ProgramMeetingRatings {
  return {
    programId: "program-1",
    heldMeetingCount: 12,
    ratedMeetingCount: 9,
    feedbackCount: 9,
    average: 4.25,
    questionAverages: [4.5, 4, null, 3.5],
    distribution: [0, 1, 4, 12, 19],
    ...overrides,
  };
}

describe("meeting ratings", () => {
  it("writes an average with one decimal in the page's number format", () => {
    expect(formatRating(4.25, "tr")).toBe("4,3");
    expect(formatRating(4, "tr")).toBe("4,0");
    expect(formatRating(4.25, "en")).toBe("4.3");
    expect(formatRating(null, "tr")).toBe("—");
  });

  it("gives the share of held meetings a mentee rated", () => {
    expect(ratingResponseRate(ratings())).toBe(75);
    expect(ratingResponseRate(ratings({ heldMeetingCount: 0 }))).toBeNull();
  });

  it("fills the Memnuniyet KPI, or says why it is empty", () => {
    expect(satisfactionKpi(ratings(), t, "tr")).toEqual({
      value: "4,3/5",
      detail: "9/12 görüşme değerlendirildi",
    });
    expect(satisfactionKpi(ratings(), tEn, "en")).toEqual({
      value: "4.3/5",
      detail: "9/12 meetings rated",
    });
    expect(
      satisfactionKpi(ratings({ average: null, ratedMeetingCount: 0 }), t, "tr")
        .detail,
    ).toBe("henüz değerlendirme yok");
    expect(
      satisfactionKpi(ratings({ average: null, heldMeetingCount: 0 }), t, "tr")
        .detail,
    ).toBe("bu pencerede görüşme yok");
    expect(satisfactionKpi(undefined, t, "tr").value).toBe("—");
  });

  it("lists each question's average, including an unanswered one", () => {
    const rows = ratingQuestionRows(ratings());
    expect(rows.map((row) => row.id)).toEqual([
      "nextSteps",
      "fit",
      "expression",
      "confidence",
    ]);
    expect(rows[2]?.average).toBeNull();
  });
});

describe("feedbackRatingRows", () => {
  it("labels a mentee's answers with the mentee form's questions", () => {
    expect(feedbackRatingRows(programMeetingFeedback())).toEqual([
      { labelKey: "questions.nextSteps", rating: 5, clarity: null },
      { labelKey: "questions.fit", rating: 4, clarity: null },
      { labelKey: "questions.expression", rating: 4, clarity: null },
      { labelKey: "questions.confidence", rating: 3, clarity: null },
    ]);
  });

  it("labels a mentor's answers and reads the clarity score back as the choice made", () => {
    expect(
      feedbackRatingRows(
        programMeetingFeedback({
          side: MeetingFeedbackSide.Mentor,
          ratings: [4, 3],
        }),
      ),
    ).toEqual([
      { labelKey: "mentorQuestions.preparedness", rating: 4, clarity: null },
      {
        labelKey: "mentorQuestions.clarity",
        rating: 3,
        clarity: OutcomeClarity.Partly,
      },
    ]);
  });

  it("leaves out skipped answers and any past the form's questions", () => {
    expect(
      feedbackRatingRows(
        programMeetingFeedback({
          side: MeetingFeedbackSide.Mentor,
          ratings: [0, 5, 5],
        }),
      ),
    ).toEqual([
      {
        labelKey: "mentorQuestions.clarity",
        rating: 5,
        clarity: OutcomeClarity.Yes,
      },
    ]);
  });

  it("has a label for every key in both languages", () => {
    for (const locale of [Locale.Tr, Locale.En]) {
      const translate = translatorIn(locale, "meetingRatings");
      for (const side of [
        MeetingFeedbackSide.Mentee,
        MeetingFeedbackSide.Mentor,
      ]) {
        for (const row of feedbackRatingRows(
          programMeetingFeedback({ side, ratings: [1, 2, 3, 4] }),
        )) {
          expect(translate(row.labelKey)).not.toContain("meetingRatings.");
        }
      }
    }
  });
});

describe("feedbackQualities", () => {
  it("finds the message id of each saved quality in the author's form", () => {
    expect(
      feedbackQualities(
        programMeetingFeedback({
          qualities: ["Somut aksiyonlar belirlemek", "Eski bir seçenek"],
        }),
      ),
    ).toEqual([
      { text: "Somut aksiyonlar belirlemek", menteeId: "actions" },
      { text: "Eski bir seçenek" },
    ]);
    expect(
      feedbackQualities(
        programMeetingFeedback({
          side: MeetingFeedbackSide.Mentor,
          qualities: ["Saygılı", "Somut aksiyonlar belirlemek"],
        }),
      ),
    ).toEqual([
      { text: "Saygılı", mentorId: "respectful" },
      { text: "Somut aksiyonlar belirlemek" },
    ]);
  });
});
