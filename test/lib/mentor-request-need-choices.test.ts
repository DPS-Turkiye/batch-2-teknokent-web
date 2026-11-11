import { describe, expect, it } from "vitest";

import {
  needChoices,
  supportAreaForNeedTopic,
} from "@/lib/mentor-request-need";
import { STUDENT_TOPICS } from "@/lib/student-topics";

describe("needChoices", () => {
  it("keeps startups on the startup topics and situations", () => {
    const startup = needChoices(false);

    expect(startup.topics.map((topic) => topic.id)).toEqual([
      "product",
      "customer",
      "growth",
      "finance",
      "investment",
      "team",
      "other",
    ]);
    expect(startup.situations.map((situation) => situation.id)).toEqual([
      "value",
      "onboarding",
      "focus",
      "problem",
      "positioning",
      "none",
    ]);
    expect(startup.defaultTopicId).toBe("product");
    expect(startup.defaultSituationId).toBe("onboarding");
  });

  it("gives students their own topics and situations, plus the shared other ones", () => {
    const student = needChoices(true);

    expect(student.topics.map((topic) => topic.id)).toEqual([
      "career",
      "internship",
      "cv",
      "interview",
      "job",
      "courses",
      "erasmus",
      "project",
      "other",
    ]);
    expect(student.situations.map((situation) => situation.id)).toEqual([
      "start",
      "decide",
      "apply",
      "review",
      "none",
    ]);
    expect(student.defaultTopicId).toBe("career");
    expect(student.defaultSituationId).toBe("start");
  });

  it("sends the same words student mentors pick, so matching links them", () => {
    const areas = needChoices(true)
      .topics.filter((topic) => topic.id !== "other")
      .map((topic) => supportAreaForNeedTopic(topic.id));

    expect(areas).toEqual([...STUDENT_TOPICS]);
  });
});
