import { beforeEach, describe, expect, it } from "vitest";

import { readTourRun, writeTourRun } from "@/lib/product-tour-storage";
import { useProductTourStore } from "@/stores/product-tour-store";
import { TourPhase, TourRole } from "@/types/product-tour";
import { resetProductTour } from "@test/fixtures/product-tour";

function actions() {
  return useProductTourStore.getState().actions;
}

function run() {
  return useProductTourStore.getState().run;
}

beforeEach(() => {
  resetProductTour();
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
    actions().next(2, 0);
    expect(run()?.stepIndex).toBe(1);
    expect(readTourRun("user-1")?.stepIndex).toBe(1);
    actions().next(2, 1);
    expect(run()?.phase).toBe(TourPhase.Done);
  });

  it("ignores a second click on a step it already left", () => {
    actions().hydrate("user-1");
    actions().open(TourRole.Student);
    actions().start();
    actions().next(5, 0);
    actions().next(5, 0);
    expect(run()?.stepIndex).toBe(1);
  });

  it("only moves on while a step is showing", () => {
    actions().hydrate("user-1");
    actions().open(TourRole.Student);
    actions().next(5, 0);
    expect(run()).toEqual({
      role: TourRole.Student,
      phase: TourPhase.Welcome,
      stepIndex: 0,
    });
  });

  it("finishes early with Turu Bitir and forgets the run when dismissed", () => {
    actions().hydrate("user-1");
    actions().open(TourRole.IskurStudent);
    actions().start();
    actions().finish();
    expect(run()?.phase).toBe(TourPhase.Done);
    actions().dismiss(TourRole.IskurStudent);
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

describe("openIfIdle", () => {
  it("opens the welcome when nothing runs", () => {
    actions().openIfIdle("user-1", TourRole.Student);
    expect(run()).toEqual({
      role: TourRole.Student,
      phase: TourPhase.Welcome,
      stepIndex: 0,
    });
  });

  it("keeps a run saved before a reload instead of starting over", () => {
    writeTourRun("user-1", {
      role: TourRole.Student,
      phase: TourPhase.Step,
      stepIndex: 2,
    });
    actions().openIfIdle("user-1", TourRole.Student);
    expect(run()?.stepIndex).toBe(2);
    expect(run()?.phase).toBe(TourPhase.Step);
  });

  it("does not reopen a tour closed in this tab, but replay still opens it", () => {
    actions().openIfIdle("user-1", TourRole.Student);
    actions().dismiss(TourRole.Student);
    actions().dismiss(TourRole.Student);
    actions().openIfIdle("user-1", TourRole.Student);
    expect(run()).toBeNull();
    expect(useProductTourStore.getState().dismissed).toEqual([
      TourRole.Student,
    ]);
    actions().open(TourRole.Student);
    expect(run()?.phase).toBe(TourPhase.Welcome);
  });
});
