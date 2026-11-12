import { describe, expect, it } from "vitest";

import { Edition } from "@/interfaces/edition";
import { loginChoices } from "@/lib/login-choices";

describe("loginChoices", () => {
  it("gives Teknokent OTG, sign-up and invite codes, never ODTÜ's sign-in", () => {
    expect(loginChoices(Edition.Teknokent, true)).toEqual({
      odtu: false,
      otg: true,
      signUp: true,
      invite: true,
    });
  });

  it("leads ODTÜ with its own sign-in once one is wired, with student sign-up and no OTG or invites", () => {
    expect(loginChoices(Edition.Odtu, true)).toEqual({
      odtu: true,
      otg: false,
      signUp: true,
      invite: false,
    });
    expect(loginChoices(Edition.Odtu, false).odtu).toBe(false);
  });
});
