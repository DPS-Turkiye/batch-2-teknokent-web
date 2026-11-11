import { describe, expect, it } from "vitest";

import { personProfileHref } from "@/lib/person-profile";

describe("personProfileHref", () => {
  it("keeps admins and coordinators in their own frame, with the id encoded", () => {
    expect(personProfileHref("u/1", true)).toBe("/admin/users/u%2F1");
    expect(personProfileHref("u1", false)).toBe("/coordinator/people/u1");
  });
});
