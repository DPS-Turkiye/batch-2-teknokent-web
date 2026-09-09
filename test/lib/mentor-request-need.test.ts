import { describe, expect, it } from "vitest";

import {
  canContinueGoalStep,
  canContinueNeedStep,
  canContinueSituationStep,
  expertiseForNeed,
  MENTOR_REQUEST_NEED_DRAFT_KEY,
  messageForNeedGoals,
  needTitleForSummary,
  parseNeedDraft,
  readNeedDraft,
  startupContextLine,
  summaryForNeed,
  summaryForNeedTopic,
  supportAreaForNeedTopic,
  toggleNeedGoal,
  writeNeedDraft,
} from "@/lib/mentor-request-need";

describe("mentor-request-need", () => {
  it("maps Figma topics onto existing support areas", () => {
    expect(supportAreaForNeedTopic("product")).toBe("Ürün ve ürün yönetimi");
    expect(supportAreaForNeedTopic("customer")).toBe(
      "Kullanıcı araştırması ve tasarım",
    );
    expect(supportAreaForNeedTopic("other")).toBe("Diğer");
  });

  it("uses the card copy as the request summary unless the topic is other", () => {
    expect(summaryForNeedTopic("growth", "ignored")).toContain(
      "Kullanıcı veya müşteri",
    );
    expect(summaryForNeedTopic("other", "  Pitch deck  ")).toBe("Pitch deck");
  });

  it("requires a written summary only for Başka bir konu", () => {
    expect(canContinueNeedStep("product", "")).toBe(true);
    expect(canContinueNeedStep("other", "")).toBe(false);
    expect(canContinueNeedStep("other", "Ekip kurmak")).toBe(true);
    expect(canContinueNeedStep("unknown", "")).toBe(false);
  });

  it("parses a stored need draft and ignores junk", () => {
    expect(parseNeedDraft(null)).toBeNull();
    expect(parseNeedDraft("{")).toBeNull();
    expect(parseNeedDraft(JSON.stringify({ topicId: "nope" }))).toBeNull();
    expect(
      parseNeedDraft(
        JSON.stringify({ topicId: "finance", otherSummary: "nakit" }),
      ),
    ).toEqual({
      topicId: "finance",
      otherSummary: "nakit",
      situationId: undefined,
      noneSummary: "",
      goalIds: undefined,
      goalNote: "",
    });
  });

  it("lets the mentee pick one or two meeting goals", () => {
    expect(toggleNeedGoal(["next-steps"], "roadmap")).toEqual([
      "next-steps",
      "roadmap",
    ]);
    expect(toggleNeedGoal(["next-steps", "roadmap"], "decision")).toEqual([
      "next-steps",
      "roadmap",
    ]);
    expect(toggleNeedGoal(["next-steps", "roadmap"], "roadmap")).toEqual([
      "next-steps",
    ]);
    expect(canContinueGoalStep([])).toBe(false);
    expect(canContinueGoalStep(["next-steps"])).toBe(true);
    expect(messageForNeedGoals(["next-steps"], "Kayıp sürüyor")).toBe(
      "Bir sonraki adımları belirlemek\nKayıp sürüyor",
    );
  });

  it("derives mentor expertise tags from the selected situation", () => {
    expect(expertiseForNeed("onboarding")).toEqual([
      "Onboarding",
      "UX Strategy",
      "User Research",
      "Value Proposition",
    ]);
    expect(expertiseForNeed("unknown")).toContain("Onboarding");
  });

  it("builds the Özet startup line and need title", () => {
    expect(startupContextLine(["Team TNT", "Fikir", "SaaS"])).toBe(
      "Team TNT · Fikir · SaaS",
    );
    expect(startupContextLine(["Team TNT", "", "  "])).toBe("Team TNT");
    expect(needTitleForSummary("growth", "")).toBe("Büyüme & Satış");
    expect(needTitleForSummary("other", "  Yasal süreç  ")).toBe("Yasal süreç");
  });

  it("uses the selected situation as the request summary", () => {
    expect(canContinueSituationStep("onboarding", "")).toBe(true);
    expect(canContinueSituationStep("none", "")).toBe(false);
    expect(canContinueSituationStep("none", "Kayıp yüksek")).toBe(true);
    expect(
      summaryForNeed({
        topicId: "product",
        otherSummary: "",
        situationId: "onboarding",
        noneSummary: "",
      }),
    ).toContain("ilk adımlarda");
  });

  it("round-trips a draft through sessionStorage", () => {
    writeNeedDraft({
      topicId: "team",
      otherSummary: "",
      situationId: "focus",
      noneSummary: "",
    });
    expect(sessionStorage.getItem(MENTOR_REQUEST_NEED_DRAFT_KEY)).toContain(
      "team",
    );
    expect(readNeedDraft()).toEqual({
      topicId: "team",
      otherSummary: "",
      situationId: "focus",
      noneSummary: "",
    });
    expect(readNeedDraft()).toBe(readNeedDraft());
  });
});
