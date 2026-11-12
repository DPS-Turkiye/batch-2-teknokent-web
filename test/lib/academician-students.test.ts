import { describe, expect, it } from "vitest";

import { adviseeIds } from "@/lib/academician-students";

describe("adviseeIds", () => {
  it("collects the Menton ids and skips advisees who never signed in", () => {
    const ids = adviseeIds([
      {
        userId: "u-1",
        fullName: "Ayşe Yılmaz",
        departmentName: null,
        classYear: 3,
        programLevel: null,
      },
      {
        userId: null,
        fullName: "Can Tekin",
        departmentName: null,
        classYear: 1,
        programLevel: null,
      },
    ]);
    expect([...ids]).toEqual(["u-1"]);
  });
});
