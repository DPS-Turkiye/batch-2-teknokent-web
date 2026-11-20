import { describe, expect, it } from "vitest";

import { Edition } from "@/interfaces/edition";
import { SignupRole } from "@/interfaces/signup";
import { SignupCardCopy, signupCards } from "@/lib/signup-cards";

describe("signupCards", () => {
  it("offers Teknokent founders, mentors, and teammates with a code a link to /invite", () => {
    expect(signupCards(Edition.Teknokent)).toEqual([
      { role: SignupRole.Founder, copy: SignupCardCopy.Founder, href: null },
      { role: SignupRole.Mentor, copy: SignupCardCopy.Mentor, href: null },
      { role: null, copy: SignupCardCopy.Member, href: "/invite" },
    ]);
  });

  it("offers ODTÜ only the founder flow, worded for an İŞKUR student", () => {
    expect(signupCards(Edition.Odtu)).toEqual([
      { role: SignupRole.Founder, copy: SignupCardCopy.Student, href: null },
    ]);
  });
});
