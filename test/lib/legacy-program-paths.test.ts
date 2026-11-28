import { describe, expect, it } from "vitest";

import { UserRole } from "@/interfaces/session";
import {
  legacyProgramDetailHref,
  legacyProgramsHref,
} from "@/lib/legacy-program-paths";

describe("legacy program paths", () => {
  it("sends each role from /programs to its current screen", () => {
    expect(legacyProgramsHref(UserRole.Coordinator)).toBe(
      "/coordinator/programs",
    );
    expect(legacyProgramsHref(UserRole.Admin)).toBe("/admin/programs");
    expect(legacyProgramsHref(UserRole.Mentee)).toBe("/dashboard");
  });

  it("moves only an admin off a program's page, with the id encoded", () => {
    expect(legacyProgramDetailHref(UserRole.Admin, "a/b")).toBe(
      "/admin/programs/a%2Fb",
    );
    expect(legacyProgramDetailHref(UserRole.Coordinator, "a")).toBeNull();
  });
});
