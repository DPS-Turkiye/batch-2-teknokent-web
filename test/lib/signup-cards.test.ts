import { describe, expect, it } from "vitest";

import { Edition } from "@/interfaces/edition";
import { SignupRole } from "@/interfaces/signup";
import { SignupCardCopy, signupCards } from "@/lib/signup-cards";

describe("signupCards", () => {
  it("offers Teknokent founders and mentors", () => {
    expect(signupCards(Edition.Teknokent)).toEqual([
      { role: SignupRole.Founder, copy: SignupCardCopy.Founder },
      { role: SignupRole.Mentor, copy: SignupCardCopy.Mentor },
    ]);
  });

  it("offers ODTÜ only the founder flow, worded for an İŞKUR student", () => {
    expect(signupCards(Edition.Odtu)).toEqual([
      { role: SignupRole.Founder, copy: SignupCardCopy.Student },
    ]);
  });
});
