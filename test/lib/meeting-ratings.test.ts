import { describe, expect, it } from "vitest";

import type { ProgramMeetingRatings } from "@/interfaces/program-report";
import {
  formatRating,
  ratingQuestionRows,
  ratingResponseRate,
  satisfactionKpi,
} from "@/lib/meeting-ratings";

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
  it("writes an average with one decimal and a Turkish comma", () => {
    expect(formatRating(4.25)).toBe("4,3");
    expect(formatRating(4)).toBe("4,0");
    expect(formatRating(null)).toBe("—");
  });

  it("gives the share of held meetings a mentee rated", () => {
    expect(ratingResponseRate(ratings())).toBe(75);
    expect(ratingResponseRate(ratings({ heldMeetingCount: 0 }))).toBeNull();
  });

  it("fills the Memnuniyet KPI, or says why it is empty", () => {
    expect(satisfactionKpi(ratings())).toEqual({
      value: "4,3/5",
      detail: "9/12 görüşme değerlendirildi",
    });
    expect(
      satisfactionKpi(ratings({ average: null, ratedMeetingCount: 0 })).detail,
    ).toBe("henüz değerlendirme yok");
    expect(
      satisfactionKpi(ratings({ average: null, heldMeetingCount: 0 })).detail,
    ).toBe("bu pencerede görüşme yok");
    expect(satisfactionKpi(undefined).value).toBe("—");
  });

  it("labels each question's average, including an unanswered one", () => {
    const rows = ratingQuestionRows(ratings());
    expect(rows.map((row) => row.label)).toEqual([
      "Sonraki adımlar netleşti",
      "Öneriler aşamaya uygundu",
      "Rahatça ifade edebildi",
      "İlerleme güveni",
    ]);
    expect(rows[2].average).toBeNull();
  });
});
