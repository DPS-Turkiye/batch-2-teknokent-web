import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import type { ProgramMeetingRatings } from "@/interfaces/program-report";
import {
  formatRating,
  ratingQuestionRows,
  ratingResponseRate,
  satisfactionKpi,
} from "@/lib/meeting-ratings";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

const t = createTranslator({
  locale: "tr",
  messages: tr,
  namespace: "meetingRatings",
});
const tEn = createTranslator({
  locale: "en",
  messages: en,
  namespace: "meetingRatings",
});

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
    expect(rows[2].average).toBeNull();
  });
});
