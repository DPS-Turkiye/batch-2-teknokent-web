import { create } from "zustand";

import { readTourRun, writeTourRun } from "@/lib/product-tour-storage";
import { TourPhase, type TourRole, type TourRun } from "@/types/product-tour";

type ProductTourStore = {
  /** Whose run this is; a different user in the same tab starts with nothing. */
  userId: string | null;
  run: TourRun | null;
  // One object that is never replaced, so hooks hand out stable callbacks (as in toast-store).
  actions: {
    hydrate: (userId: string) => void;
    open: (role: TourRole) => void;
    start: () => void;
    next: (stepCount: number) => void;
    finish: () => void;
    clear: () => void;
  };
};

export const useProductTourStore = create<ProductTourStore>()((set, get) => {
  function save(run: TourRun | null) {
    const { userId } = get();
    if (userId !== null) writeTourRun(userId, run);
    set({ run });
  }

  return {
    userId: null,
    run: null,
    actions: {
      hydrate: (userId) => {
        if (get().userId === userId) return;
        set({ userId, run: readTourRun(userId) });
      },
      open: (role) => save({ role, phase: TourPhase.Welcome, stepIndex: 0 }),
      start: () => {
        const { run } = get();
        if (run) save({ ...run, phase: TourPhase.Step, stepIndex: 0 });
      },
      next: (stepCount) => {
        const { run } = get();
        if (run?.phase !== TourPhase.Step) return;
        save(
          run.stepIndex + 1 < stepCount
            ? { ...run, stepIndex: run.stepIndex + 1 }
            : { ...run, phase: TourPhase.Done },
        );
      },
      finish: () => {
        const { run } = get();
        if (run) save({ ...run, phase: TourPhase.Done });
      },
      clear: () => save(null),
    },
  };
});
