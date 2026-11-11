import { create } from "zustand";

import { readTourRun, writeTourRun } from "@/lib/product-tour-storage";
import { TourPhase, type TourRole, type TourRun } from "@/types/product-tour";

type ProductTourStore = {
  /** Whose run this is; a different user in the same tab starts with nothing. */
  userId: string | null;
  run: TourRun | null;
  /**
   * Tours closed in this tab. Usually the saved outcome keeps a tour from opening again; this also holds when the
   * browser refuses to save it (blocked site data), so the welcome never comes back right after "Şimdilik Atla".
   */
  dismissed: readonly TourRole[];
  // One object that is never replaced, so hooks hand out stable callbacks (as in toast-store).
  actions: {
    hydrate: (userId: string) => void;
    /** Opens the welcome unless a tour is already running (a reload mid-tour) or was closed in this tab. */
    openIfIdle: (userId: string, role: TourRole) => void;
    /** Opens the welcome whatever happened before: "Turu tekrar izle". */
    open: (role: TourRole) => void;
    start: () => void;
    /** Moves on from `fromIndex`; a second click on the same step is ignored. */
    next: (stepCount: number, fromIndex: number) => void;
    finish: () => void;
    dismiss: (role: TourRole) => void;
  };
};

export const useProductTourStore = create<ProductTourStore>()((set, get) => {
  function save(run: TourRun | null) {
    const { userId } = get();
    if (userId !== null) writeTourRun(userId, run);
    set({ run });
  }

  function hydrate(userId: string) {
    if (get().userId === userId) return;
    set({ userId, run: readTourRun(userId), dismissed: [] });
  }

  return {
    userId: null,
    run: null,
    dismissed: [],
    actions: {
      hydrate,
      openIfIdle: (userId, role) => {
        hydrate(userId);
        const { run, dismissed } = get();
        if (run === null && !dismissed.includes(role)) {
          save({ role, phase: TourPhase.Welcome, stepIndex: 0 });
        }
      },
      open: (role) => save({ role, phase: TourPhase.Welcome, stepIndex: 0 }),
      start: () => {
        const { run } = get();
        if (run) save({ ...run, phase: TourPhase.Step, stepIndex: 0 });
      },
      next: (stepCount, fromIndex) => {
        const { run } = get();
        if (run?.phase !== TourPhase.Step || run.stepIndex !== fromIndex) {
          return;
        }
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
      dismiss: (role) => {
        const { dismissed } = get();
        set({
          dismissed: dismissed.includes(role)
            ? dismissed
            : [...dismissed, role],
        });
        save(null);
      },
    },
  };
});
