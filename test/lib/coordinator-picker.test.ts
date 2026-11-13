import { describe, expect, it } from "vitest";

import {
  addChoice,
  choiceKey,
  CoordinatorChoiceKind,
  existingChoice,
  inviteCandidateEmail,
  invitedChoice,
  isSearchable,
  normalizeEmail,
  removeChoice,
  splitChoices,
  unpickedResults,
} from "@/lib/coordinator-picker";

const ayse = { id: "c-1", fullName: "Ayşe Aydın", email: "Ayse@Teknokent.org" };
const elif = { id: "c-2", fullName: "Elif Demir", email: "elif@teknokent.org" };

describe("coordinator picker", () => {
  it("compares e-mails trimmed and case-insensitively", () => {
    expect(normalizeEmail("  Ayse@Teknokent.ORG ")).toBe("ayse@teknokent.org");
  });

  it("searches only from three typed characters", () => {
    expect(isSearchable("ay")).toBe(false);
    expect(isSearchable("  ay  ")).toBe(false);
    expect(isSearchable("ays")).toBe(true);
  });

  it("keys an existing coordinator by id and an invite by its e-mail", () => {
    expect(choiceKey(existingChoice(ayse))).toBe("c-1");
    expect(choiceKey(invitedChoice(" Yeni@X.org ", "Yeni"))).toBe(
      "invite:yeni@x.org",
    );
  });

  it("builds an invite with a trimmed name and a normalized e-mail", () => {
    expect(invitedChoice(" Yeni@X.org ", "  Yeni Kişi ")).toEqual({
      kind: CoordinatorChoiceKind.Invited,
      email: "yeni@x.org",
      fullName: "Yeni Kişi",
    });
  });

  it("adds a person once, whatever the e-mail's case", () => {
    const chosen = addChoice([], existingChoice(ayse));

    expect(
      addChoice(chosen, invitedChoice("ayse@teknokent.org", "Ayşe")),
    ).toEqual(chosen);
    expect(addChoice(chosen, existingChoice(elif))).toEqual([
      existingChoice(ayse),
      existingChoice(elif),
    ]);
  });

  it("removes a choice by its key", () => {
    const chosen = [existingChoice(ayse), invitedChoice("yeni@x.org", "Yeni")];

    expect(removeChoice(chosen, "invite:yeni@x.org")).toEqual([
      existingChoice(ayse),
    ]);
    expect(removeChoice(chosen, "c-1")).toEqual([
      invitedChoice("yeni@x.org", "Yeni"),
    ]);
  });

  it("hides results the admin already picked", () => {
    expect(unpickedResults([ayse, elif], [existingChoice(ayse)])).toEqual([
      elif,
    ]);
  });

  it("offers an invite only for a whole e-mail that nobody listed or chose", () => {
    expect(inviteCandidateEmail("yeni@x", [], [])).toBeNull();
    expect(inviteCandidateEmail(" Yeni@X.org ", [], [])).toBe("yeni@x.org");
    expect(inviteCandidateEmail("ayse@teknokent.org", [ayse], [])).toBeNull();
    expect(
      inviteCandidateEmail(
        "yeni@x.org",
        [],
        [invitedChoice("YENI@x.org", "Yeni")],
      ),
    ).toBeNull();
  });

  it("splits the choices into ids and invites for the create request", () => {
    expect(
      splitChoices([
        existingChoice(ayse),
        invitedChoice("yeni@x.org", "Yeni Kişi"),
        existingChoice(elif),
      ]),
    ).toEqual({
      coordinatorIds: ["c-1", "c-2"],
      newCoordinators: [{ fullName: "Yeni Kişi", email: "yeni@x.org" }],
    });
  });
});
