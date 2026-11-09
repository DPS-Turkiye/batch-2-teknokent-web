import { describe, expect, it } from "vitest";

import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { PROFILE_COMPLETION_CATEGORIES } from "@/lib/client/fixtures/student-profile-completion";
import {
  activeCatalogue,
  chosenCategories,
  toggleInterestSubtopic,
  toggleInterestTopic,
} from "@/lib/student-interests";

const start = {
  topics: [PeerTopicCategory.CareerInternship, PeerTopicCategory.CampusLife],
  subtopics: ["fixture-cv", "fixture-clubs"],
  goal: "x",
};

describe("student interests", () => {
  it("adds a topic and keeps the other fields", () => {
    const next = toggleInterestTopic(
      start,
      PeerTopicCategory.International,
      PROFILE_COMPLETION_CATEGORIES,
    );
    expect(next.topics).toContain(PeerTopicCategory.International);
    expect(next.subtopics).toEqual(["fixture-cv", "fixture-clubs"]);
    expect(next.goal).toBe("x");
  });

  it("removing a topic drops only its own sub-topics", () => {
    const next = toggleInterestTopic(
      start,
      PeerTopicCategory.CareerInternship,
      PROFILE_COMPLETION_CATEGORIES,
    );
    expect(next.topics).toEqual([PeerTopicCategory.CampusLife]);
    expect(next.subtopics).toEqual(["fixture-clubs"]);
  });

  it("toggles a sub-topic", () => {
    expect(toggleInterestSubtopic(start, "fixture-cv").subtopics).toEqual([
      "fixture-clubs",
    ]);
    expect(toggleInterestSubtopic(start, "fixture-time").subtopics).toContain(
      "fixture-time",
    );
  });

  it("lists chosen categories in catalogue order", () => {
    expect(
      chosenCategories(PROFILE_COMPLETION_CATEGORIES, [
        PeerTopicCategory.International,
        PeerTopicCategory.AcademicDevelopment,
      ]).map((item) => item.id),
    ).toEqual([
      PeerTopicCategory.AcademicDevelopment,
      PeerTopicCategory.International,
    ]);
  });
});

describe("activeCatalogue", () => {
  it("keeps the catalogue's order and only the active categories", () => {
    const catalogue = [
      { id: PeerTopicCategory.AcademicDevelopment, subtopics: [] },
      { id: PeerTopicCategory.CareerInternship, subtopics: [] },
      { id: PeerTopicCategory.International, subtopics: [] },
    ];
    expect(
      activeCatalogue(catalogue, [
        PeerTopicCategory.International,
        PeerTopicCategory.AcademicDevelopment,
      ]).map((item) => item.id),
    ).toEqual([
      PeerTopicCategory.AcademicDevelopment,
      PeerTopicCategory.International,
    ]);
    expect(activeCatalogue(catalogue, [])).toEqual([]);
  });
});
