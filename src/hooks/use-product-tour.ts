"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAppSession } from "@/components/providers/session-provider";
import { useInstitutionRecord } from "@/hooks/use-institution-record";
import { useTourTarget } from "@/hooks/use-tour-target";
import { Workspace } from "@/interfaces/workspace";
import { isOnRoute, tourRoleOf, TOURS } from "@/lib/product-tour";
import { readTourOutcome, writeTourOutcome } from "@/lib/product-tour-storage";
import { useProductTourStore } from "@/stores/product-tour-store";
import { TourAdvance, TourOutcome, TourPhase } from "@/types/product-tour";

/**
 * The tour written for this workspace, once the account is known. An ODTÜ student's tour depends on whether
 * they are an İŞKUR participant, so it waits for their institution record.
 */
export function useTourRole(workspace: Workspace) {
  const session = useAppSession();
  const student = workspace === Workspace.OdtuStudent;
  const institution = useInstitutionRecord(student);
  const known = session !== null && !(student && institution.isPending);
  return {
    userId: session?.userId ?? null,
    role: known
      ? tourRoleOf(workspace, institution.data?.iskurParticipant ?? false)
      : null,
  };
}

/**
 * The tour on a workspace's pages: it opens by itself on the home page until the user finishes or skips it, walks
 * through the steps across pages, and remembers the outcome per user and role.
 */
export function useProductTour(workspace: Workspace) {
  const { userId, role } = useTourRole(workspace);
  const pathname = usePathname();
  const router = useRouter();
  const storedRun = useProductTourStore((state) => state.run);
  const actions = useProductTourStore((state) => state.actions);

  useEffect(() => {
    if (userId !== null) actions.hydrate(userId);
  }, [actions, userId]);

  const definition = role === null ? null : TOURS[role];
  // A run of another workspace's tour stays saved but is not shown here.
  const run = storedRun?.role === role ? storedRun : null;
  const step =
    run?.phase === TourPhase.Step
      ? (definition?.steps[run.stepIndex] ?? null)
      : null;
  const stepCount = definition?.steps.length ?? 0;

  useEffect(() => {
    if (
      userId === null ||
      role === null ||
      definition === null ||
      storedRun !== null ||
      !isOnRoute(pathname, definition.home) ||
      readTourOutcome(userId, role) !== null
    ) {
      return;
    }
    actions.open(role);
  }, [actions, definition, pathname, role, storedRun, userId]);

  const target = useTourTarget(
    step?.anchor ?? null,
    `${role ?? ""}:${run?.stepIndex ?? -1}`,
    step?.advance === TourAdvance.Click ? () => actions.next(stepCount) : null,
  );

  // The step's own page, when its element did not turn up where the user is (a reload, a page that does not
  // lead there by itself).
  const route = step?.route;
  useEffect(() => {
    if (target.missing && route !== undefined && !isOnRoute(pathname, route)) {
      router.push(route);
    }
  }, [pathname, route, router, target.missing]);

  function leave(outcome: TourOutcome) {
    if (userId !== null && role !== null) {
      writeTourOutcome(userId, role, outcome);
    }
    actions.clear();
  }

  return {
    role,
    phase: run?.phase ?? null,
    step,
    stepNumber: (run?.stepIndex ?? 0) + 1,
    stepCount,
    target,
    /** "… tıkla": the element is there and can be pressed; the hint also moves keyboard focus to it. */
    offersHint: step?.advance === TourAdvance.Click && target.interactive,
    /** Show "İleri": the element is missing, or a keyboard cannot press it. */
    offersNext:
      step?.advance === TourAdvance.Click &&
      (target.missing || (target.element !== null && !target.interactive)),
    focusTarget: () => target.element?.focus(),
    start: actions.start,
    next: () => actions.next(stepCount),
    finish: actions.finish,
    skip: () => leave(TourOutcome.Skipped),
    close: () => leave(TourOutcome.Completed),
    exit: () => {
      leave(TourOutcome.Completed);
      if (definition !== null) router.push(definition.exit);
    },
  };
}

/** "Turu tekrar izle" on Profilim: opens this workspace's tour again from its welcome. */
export function useProductTourReplay(workspace: Workspace) {
  const { userId, role } = useTourRole(workspace);
  const actions = useProductTourStore((state) => state.actions);
  return {
    available: role !== null,
    replay: () => {
      if (userId === null || role === null) return;
      actions.hydrate(userId);
      actions.open(role);
    },
  };
}
