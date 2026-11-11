import { describe, expect, it } from "vitest";

import { Edition } from "@/interfaces/edition";
import { isPathOpenIn, parseEdition } from "@/lib/edition";

const ODTU_PAGES = [
  "/student",
  "/student/",
  "/student/peer-mentoring/training",
  "/academician",
  "/academician/advisees",
  "/office-hours/courses/c-1",
  "/lti/launch",
  "/lti/login",
  "/login/odtu/dev",
  "/%73tudent",
];
const TEKNOKENT_PAGES = [
  "/m",
  "/m/login",
  "/m/go",
  "/assistant",
  "/auth/otg/start",
  "/auth/otg/callback",
];
const SHARED_PAGES = [
  "/",
  "/login",
  "/signup",
  "/workspace",
  "/admin",
  "/coordinator/programs",
  "/startup/process",
  "/mentor-request",
  "/mentors",
  "/meetings",
  "/students",
  "/mobile",
  "/assistants",
  "/login/odtuX",
  "/%E0%A4%A",
];

describe("parseEdition", () => {
  it.each([undefined, "", "  "])(
    "reads an unset or blank value (%j) as Teknokent",
    (value) => {
      expect(parseEdition(value)).toBe(Edition.Teknokent);
    },
  );

  it.each([
    ["ODTU", Edition.Odtu],
    [" odtu ", Edition.Odtu],
    ["TEKNOKENT", Edition.Teknokent],
    ["teknokent", Edition.Teknokent],
  ])("reads %j", (value, edition) => {
    expect(parseEdition(value)).toBe(edition);
  });

  it.each(["METU", "ODTÜ", "TEKNOKENT,ODTU"])(
    "refuses an unknown value (%j) instead of guessing",
    (value) => {
      expect(() => parseEdition(value)).toThrow(/APP_EDITION/);
    },
  );
});

describe("isPathOpenIn", () => {
  it.each(ODTU_PAGES)("closes %s in the Teknokent edition", (path) => {
    expect(isPathOpenIn(Edition.Teknokent, path)).toBe(false);
    expect(isPathOpenIn(Edition.Odtu, path)).toBe(true);
  });

  it.each(TEKNOKENT_PAGES)("closes %s in the ODTÜ edition", (path) => {
    expect(isPathOpenIn(Edition.Odtu, path)).toBe(false);
    expect(isPathOpenIn(Edition.Teknokent, path)).toBe(true);
  });

  it.each(SHARED_PAGES)("keeps %s open in both editions", (path) => {
    expect(isPathOpenIn(Edition.Teknokent, path)).toBe(true);
    expect(isPathOpenIn(Edition.Odtu, path)).toBe(true);
  });
});
