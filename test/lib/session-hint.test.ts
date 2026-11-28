import { afterEach, describe, expect, it } from "vitest";

import { UserRole } from "@/interfaces/session";
import {
  clearSignedInHint,
  readSignedInHint,
  SIGNED_IN_HINT_COOKIE,
  signedInHintRole,
  writeSignedInHint,
} from "@/lib/session-hint";

afterEach(() => clearSignedInHint());

describe("signed-in hint", () => {
  it("names only a known role", () => {
    expect(signedInHintRole(UserRole.Coordinator)).toBe(UserRole.Coordinator);
    for (const value of [undefined, null, "", "ROOT", "mentee"]) {
      expect(signedInHintRole(value)).toBeNull();
    }
  });

  it("is written on sign-in, read back and dropped on sign-out", () => {
    expect(readSignedInHint()).toBeNull();

    writeSignedInHint(UserRole.Mentor, false);
    expect(readSignedInHint()).toBe(UserRole.Mentor);
    expect(document.cookie).toContain(
      `${SIGNED_IN_HINT_COOKIE}=${UserRole.Mentor}`,
    );

    clearSignedInHint();
    expect(readSignedInHint()).toBeNull();
  });

  it("outlives the browser only with beni hatırla", () => {
    writeSignedInHint(UserRole.Mentee, true);
    expect(readSignedInHint()).toBe(UserRole.Mentee);
  });
});
