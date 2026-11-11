import { describe, expect, it } from "vitest";

import {
  foundersFirst,
  memberDraftError,
  MemberFormMode,
  type MemberDraft,
} from "@/lib/startup-team";
import { memberFixture } from "@test/fixtures/startup-team";

function draft(overrides: Partial<MemberDraft> = {}): MemberDraft {
  return {
    mode: MemberFormMode.Add,
    memberId: null,
    fullName: "Ece Demir",
    email: "ece@dongu.co",
    jobTitle: "",
    ...overrides,
  };
}

describe("startup team helpers", () => {
  it("puts the founder first and keeps the rest in order", () => {
    const members = [
      memberFixture("a"),
      memberFixture("founder", { founder: true }),
      memberFixture("b"),
    ];

    expect(foundersFirst(members).map((member) => member.id)).toEqual([
      "founder",
      "a",
      "b",
    ]);
  });

  it("needs a name, and an email only when adding", () => {
    expect(memberDraftError(draft())).toBeNull();
    expect(memberDraftError(draft({ fullName: "  " }))).toBe("nameRequired");
    expect(memberDraftError(draft({ email: "ece" }))).toBe("emailInvalid");
    expect(
      memberDraftError(draft({ mode: MemberFormMode.Edit, email: "" })),
    ).toBeNull();
  });
});
