import { describe, expect, it } from "vitest";

import { LtiLaunchError } from "@/interfaces/office-hours";
import {
  isLtiLaunchError,
  ltiErrorFor,
  officeHoursCoursePath,
} from "@/lib/lti";
import { isOfficeHoursPath, isPublicPath } from "@/lib/public-paths";

describe("office-hours paths", () => {
  it.each([
    "/lti/login",
    "/lti/launch",
    "/office-hours",
    "/office-hours/courses/c1",
  ])("keeps the Menton sign-in away from %s", (path) => {
    expect(isOfficeHoursPath(path)).toBe(true);
    expect(isPublicPath(path)).toBe(true);
  });

  it.each(["/office-hoursx", "/ltix", "/dashboard", "/lti"])(
    "leaves %s behind the Menton sign-in",
    (path) => {
      expect(isOfficeHoursPath(path)).toBe(false);
    },
  );

  it("encodes the course id into its page path", () => {
    expect(officeHoursCoursePath("a/b")).toBe("/office-hours/courses/a%2Fb");
  });
});

describe("LTI launch errors", () => {
  it.each([
    [400, LtiLaunchError.Rejected],
    [401, LtiLaunchError.Rejected],
    [403, LtiLaunchError.NoRole],
    [500, LtiLaunchError.Unavailable],
    [503, LtiLaunchError.Unavailable],
  ])("reads a %s from the backend as %s", (status, error) => {
    expect(ltiErrorFor(status)).toBe(error);
  });

  it("knows only its own reasons", () => {
    expect(isLtiLaunchError("no-role")).toBe(true);
    expect(isLtiLaunchError("javascript:alert(1)")).toBe(false);
  });
});
