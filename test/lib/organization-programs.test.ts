import { describe, expect, it } from "vitest";

import { currentOrganizationProgram } from "@/lib/organization-programs";

const alpha = { id: "p-1", name: "Alpha", coordinatorName: "Elif" };
const beta = { id: "p-2", name: "Beta", coordinatorName: "Burcu" };

describe("currentOrganizationProgram", () => {
  it("uses the program the startup chose", () => {
    expect(
      currentOrganizationProgram({
        programs: [alpha, beta],
        activeProgramId: "p-1",
      }),
    ).toBe(alpha);
  });

  it("falls back to the last program joined, like the backend", () => {
    expect(
      currentOrganizationProgram({
        programs: [alpha, beta],
        activeProgramId: null,
      }),
    ).toBe(beta);
  });

  it("has no program without data or assignments", () => {
    expect(currentOrganizationProgram(undefined)).toBeNull();
    expect(
      currentOrganizationProgram({ programs: [], activeProgramId: null }),
    ).toBeNull();
  });
});
