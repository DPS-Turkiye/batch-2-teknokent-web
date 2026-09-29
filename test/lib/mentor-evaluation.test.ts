import { describe, expect, it } from "vitest";

import type { MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import {
  answeredQuestionCount,
  evaluationMeetingMeta,
  evaluationPayload,
  isEvaluationComplete,
  mentorMeetingEvaluationHref,
  type MentorEvaluationAnswers,
} from "@/lib/mentor-evaluation";
import { OutcomeClarity } from "@/types/mentor-evaluation";

const empty: MentorEvaluationAnswers = {
  preparedness: null,
  qualities: [],
  clarity: null,
  note: "",
};

describe("mentor evaluation answers", () => {
  it("counts a question as answered once it has a value", () => {
    expect(answeredQuestionCount(empty)).toBe(0);
    expect(
      answeredQuestionCount({
        ...empty,
        preparedness: 4,
        qualities: ["Odaklı"],
      }),
    ).toBe(2);
    expect(isEvaluationComplete({ ...empty, preparedness: 4 })).toBe(false);
    expect(
      isEvaluationComplete({
        preparedness: 4,
        qualities: ["Odaklı"],
        clarity: OutcomeClarity.No,
        note: "",
      }),
    ).toBe(true);
  });

  it("sends preparedness and clarity as ratings, the chips and then the note as benefits", () => {
    expect(
      evaluationPayload({
        preparedness: 4,
        qualities: ["Hazırlıklı", "Net sorular sordu"],
        clarity: OutcomeClarity.Partly,
        note: "  Fiyatlandırmayı netleştirelim.  ",
      }),
    ).toEqual({
      ratings: [4, 3],
      benefits: [
        "Hazırlıklı",
        "Net sorular sordu",
        "Fiyatlandırmayı netleştirelim.",
      ],
    });
  });

  it("maps Evet and Hayır to the ends of the scale and leaves out an empty note", () => {
    expect(
      evaluationPayload({
        preparedness: 2,
        qualities: ["Saygılı"],
        clarity: OutcomeClarity.Yes,
        note: "   ",
      }),
    ).toEqual({ ratings: [2, 5], benefits: ["Saygılı"] });
    expect(
      evaluationPayload({
        ...empty,
        preparedness: 1,
        clarity: OutcomeClarity.No,
      }).ratings,
    ).toEqual([1, 1]);
  });
});

describe("evaluationMeetingMeta", () => {
  const meeting: MeetingItem = {
    id: "m1",
    organizationId: "org-1",
    organizationName: "Döngü",
    mentorshipRequestId: "r1",
    scheduledAt: "2026-09-05T11:00:00Z",
    durationMinutes: 45,
    agenda: "UX Flow Review",
    status: "COMPLETED",
  };

  it("names the startup, the mentee, the meeting and when it was", () => {
    const meta = evaluationMeetingMeta(meeting, {
      requesterName: "Gülse Buran",
    } as MentorshipRequest);

    expect(meta).toMatch(
      /^Döngü · Gülse · UX Flow Review · 5 Eylül · \d{2}:\d{2} · 45 dk$/,
    );
  });

  it("falls back to the request's topic and skips what is unknown", () => {
    const meta = evaluationMeetingMeta(
      { ...meeting, agenda: undefined, organizationName: undefined },
      {
        organizationName: "Döngü",
        supportArea: "Fiyatlandırma",
      } as MentorshipRequest,
    );

    expect(meta.startsWith("Döngü · Fiyatlandırma · 5 Eylül")).toBe(true);
  });
});

describe("mentorMeetingEvaluationHref", () => {
  it("points at the mentor's evaluation page for the meeting", () => {
    expect(mentorMeetingEvaluationHref("m 1")).toBe(
      "/mentor-dashboard/meetings/m%201/evaluation",
    );
  });
});
