import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  readTourOutcome,
  readTourRun,
  writeTourOutcome,
  writeTourRun,
} from "@/lib/product-tour-storage";
import { TourOutcome, TourPhase, TourRole } from "@/types/product-tour";

const RUN_KEY = "menton.productTour.v1.run:user-1";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("tour outcome", () => {
  it("is null until the user finishes or skips the role's tour", () => {
    expect(readTourOutcome("user-1", TourRole.Student)).toBeNull();
  });

  it("is kept per user and per role", () => {
    writeTourOutcome("user-1", TourRole.Student, TourOutcome.Skipped);
    expect(readTourOutcome("user-1", TourRole.Student)).toBe(
      TourOutcome.Skipped,
    );
    expect(readTourOutcome("user-1", TourRole.Academician)).toBeNull();
    expect(readTourOutcome("user-2", TourRole.Student)).toBeNull();
  });

  it("ignores a value it did not write", () => {
    window.localStorage.setItem(
      `menton.productTour.v1:user-1:${TourRole.Student}`,
      "maybe",
    );
    expect(readTourOutcome("user-1", TourRole.Student)).toBeNull();
  });

  it("treats blocked storage as not seen and does not throw when saving", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readTourOutcome("user-1", TourRole.Student)).toBeNull();
    expect(() =>
      writeTourOutcome("user-1", TourRole.Student, TourOutcome.Completed),
    ).not.toThrow();
  });
});

describe("tour run", () => {
  it("comes back as it was saved, and is gone once cleared", () => {
    const run = {
      role: TourRole.IskurStudent,
      phase: TourPhase.Step,
      stepIndex: 2,
    };
    writeTourRun("user-1", run);
    expect(readTourRun("user-1")).toEqual(run);
    writeTourRun("user-1", null);
    expect(readTourRun("user-1")).toBeNull();
  });

  it("refuses text that is not JSON", () => {
    window.sessionStorage.setItem(RUN_KEY, "{not json");
    expect(readTourRun("user-1")).toBeNull();
  });

  it.each([
    ["not an object", "3"],
    ["null", "null"],
    [
      "an unknown role",
      JSON.stringify({ role: "ADMIN", phase: TourPhase.Step, stepIndex: 0 }),
    ],
    [
      "an unknown phase",
      JSON.stringify({ role: TourRole.Student, phase: "X", stepIndex: 0 }),
    ],
    [
      "a step given as text",
      JSON.stringify({
        role: TourRole.Student,
        phase: TourPhase.Step,
        stepIndex: "1",
      }),
    ],
    [
      "a negative step",
      JSON.stringify({
        role: TourRole.Student,
        phase: TourPhase.Step,
        stepIndex: -1,
      }),
    ],
    [
      "a fractional step",
      JSON.stringify({
        role: TourRole.Student,
        phase: TourPhase.Step,
        stepIndex: 1.5,
      }),
    ],
  ])("refuses a saved run with %s", (_name, saved) => {
    window.sessionStorage.setItem(RUN_KEY, saved);
    expect(readTourRun("user-1")).toBeNull();
  });
});
