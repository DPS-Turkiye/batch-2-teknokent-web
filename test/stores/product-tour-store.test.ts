import { beforeEach, describe, expect, it } from "vitest";

import { readTourRun, writeTourRun } from "@/lib/product-tour-storage";
import { useProductTourStore } from "@/stores/product-tour-store";
import { TourPhase, TourRole } from "@/types/product-tour";

function actions() {
  return useProductTourStore.getState().actions;
}

function run() {
  return useProductTourStore.getState().run;
}

beforeEach(() => {
  window.sessionStorage.clear();
  useProductTourStore.setState({ userId: null, run: null });
});

describe("product tour store", () => {
  it("picks up the run this user left open in the tab", () => {
    writeTourRun("user-1", {
      role: TourRole.Student,
      phase: TourPhase.Step,
      stepIndex: 3,
    });
    actions().hydrate("user-1");
    expect(run()).toEqual({
      role: TourRole.Student,
      phase: TourPhase.Step,
      stepIndex: 3,
    });
  });

  it("does not reload the run for the same user, and drops it for another", () => {
    actions().hydrate("user-1");
    actions().open(TourRole.Student);
    actions().hydrate("user-1");
    expect(run()?.phase).toBe(TourPhase.Welcome);
    actions().hydrate("user-2");
    expect(run()).toBeNull();
  });

  it("walks welcome → steps → done and saves every move", () => {
    actions().hydrate("user-1");
    actions().open(TourRole.Academician);
    actions().start();
    expect(run()).toEqual({
      role: TourRole.Academician,
      phase: TourPhase.Step,
      stepIndex: 0,
    });
    actions().next(2);
    expect(run()?.stepIndex).toBe(1);
    expect(readTourRun("user-1")?.stepIndex).toBe(1);
    actions().next(2);
    expect(run()?.phase).toBe(TourPhase.Done);
  });

  it("only moves on while a step is showing", () => {
    actions().hydrate("user-1");
    actions().open(TourRole.Student);
    actions().next(5);
    expect(run()).toEqual({
      role: TourRole.Student,
      phase: TourPhase.Welcome,
      stepIndex: 0,
    });
  });

  it("finishes early with Turu Bitir and forgets the run when cleared", () => {
    actions().hydrate("user-1");
    actions().open(TourRole.IskurStudent);
    actions().start();
    actions().finish();
    expect(run()?.phase).toBe(TourPhase.Done);
    actions().clear();
    expect(run()).toBeNull();
    expect(readTourRun("user-1")).toBeNull();
  });

  it("does nothing to start or finish when no tour is open", () => {
    actions().start();
    actions().finish();
    expect(run()).toBeNull();
  });

  it("keeps a run in memory only until it knows whose it is", () => {
    actions().open(TourRole.Student);
    expect(run()?.role).toBe(TourRole.Student);
    expect(window.sessionStorage.length).toBe(0);
  });
});
