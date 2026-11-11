import { describe, expect, it } from "vitest";

import { StudyLevel } from "@/interfaces/institution";
import {
  PEER_TOPIC_CATEGORIES,
  PeerTopicCategory,
} from "@/interfaces/peer-mentoring";
import { ProfileCompletionStep } from "@/interfaces/student-profile-completion";
import { PROFILE_COMPLETION_CATEGORIES } from "@/lib/client/fixtures/student-profile-completion";
import {
  completionStepState,
  completionSummary,
  PEER_TOPIC_ICONS,
  PROFILE_COMPLETION_STEPS,
  titledName,
  welcomeFacts,
} from "@/lib/profile-completion";
import { CompletionStepState, WelcomeFact } from "@/types/profile-completion";
import { STUDENT_RECORD } from "@test/fixtures/profile-completion";

describe("completionStepState", () => {
  it("marks earlier steps done, the current one current and later ones upcoming", () => {
    expect(
      PROFILE_COMPLETION_STEPS.map((step) =>
        completionStepState(step, ProfileCompletionStep.Topics),
      ),
    ).toEqual([
      CompletionStepState.Done,
      CompletionStepState.Current,
      CompletionStepState.Upcoming,
    ]);
  });
});

describe("completionSummary", () => {
  it("keeps catalogue order and drops sub-topics of unchosen topics", () => {
    const summary = completionSummary(PROFILE_COMPLETION_CATEGORIES, {
      topics: [
        PeerTopicCategory.TechnicalDigital,
        PeerTopicCategory.AcademicDevelopment,
      ],
      subtopics: ["fixture-code", "fixture-cv"],
    });
    expect(summary.topics).toEqual([
      PeerTopicCategory.AcademicDevelopment,
      PeerTopicCategory.TechnicalDigital,
    ]);
    expect(summary.subtopics.map((sub) => sub.id)).toEqual(["fixture-code"]);
  });

  it("is empty when nothing is chosen", () => {
    expect(
      completionSummary(PROFILE_COMPLETION_CATEGORIES, {
        topics: [],
        subtopics: [],
      }),
    ).toEqual({ topics: [], subtopics: [] });
  });
});

describe("titledName", () => {
  it("puts the title before the name, and leaves it out when there is none", () => {
    expect(titledName("Doç. Dr.", "Elif Şahin")).toBe("Doç. Dr. Elif Şahin");
    expect(titledName(null, "Elif Şahin")).toBe("Elif Şahin");
  });
});

describe("welcomeFacts", () => {
  it("lists the record's rows in the design's order with a worded class", () => {
    const facts = welcomeFacts(
      STUDENT_RECORD,
      (year, level) => `${year}-${level}`,
    );
    expect(facts).toEqual([
      { key: WelcomeFact.FullName, value: "Ayşe Yılmaz" },
      { key: WelcomeFact.Email, value: "ayse.yilmaz@odtu-dev.invalid" },
      { key: WelcomeFact.Department, value: "Endüstri Mühendisliği" },
      { key: WelcomeFact.ClassYear, value: `3-${StudyLevel.Bachelor}` },
      { key: WelcomeFact.Advisor, value: "Doç. Dr. Elif Şahin" },
    ]);
  });

  it("leaves missing values as null", () => {
    const facts = welcomeFacts(
      {
        ...STUDENT_RECORD,
        email: null,
        departmentName: null,
        classYear: null,
        programLevel: null,
        advisor: null,
      },
      () => null,
    );
    expect(facts.slice(1).every((fact) => fact.value === null)).toBe(true);
  });
});

describe("PEER_TOPIC_ICONS", () => {
  it("has an icon for every topic category", () => {
    for (const category of PEER_TOPIC_CATEGORIES) {
      expect(PEER_TOPIC_ICONS[category]).toMatch(/^\/ia\/profile\/.+\.svg$/);
    }
  });
});
