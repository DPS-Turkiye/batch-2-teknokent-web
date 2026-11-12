import { describe, expect, it } from "vitest";

import { invalidFieldNames } from "@/lib/field-errors";

describe("invalidFieldNames", () => {
  it("names each top-level field once, in the backend's order", () => {
    expect(
      invalidFieldNames({
        phone: "must match",
        "teamMembers[0].email": "must be a well-formed email address",
        "teamMembers[1].fullName": "must not be blank",
        "contactPreferences[2]": "must not be null",
      }),
    ).toEqual(["phone", "teamMembers", "contactPreferences"]);
  });

  it("is empty without field errors", () => {
    expect(invalidFieldNames({})).toEqual([]);
  });
});
