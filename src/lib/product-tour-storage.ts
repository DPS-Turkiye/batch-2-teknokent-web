import { isEnumValue } from "@/lib/enum";
import { TOURS } from "@/lib/product-tour";
import {
  TourOutcome,
  TourPhase,
  TourRole,
  type TourRun,
} from "@/types/product-tour";

// Per browser, per user and role: no backend flag yet. "v1" lets a reworked tour be shown again.
const OUTCOME_PREFIX = "menton.productTour.v1";
const RUN_PREFIX = "menton.productTour.v1.run";

type StorageKind = "localStorage" | "sessionStorage";

function outcomeKey(userId: string, role: TourRole) {
  return `${OUTCOME_PREFIX}:${userId}:${role}`;
}

function runKey(userId: string) {
  return `${RUN_PREFIX}:${userId}`;
}

// Storage can be missing (server render) or throw (blocked site data, private mode); the tour then just runs.
function read(kind: StorageKind, key: string) {
  if (typeof window === "undefined") return null;
  try {
    return window[kind].getItem(key);
  } catch {
    return null;
  }
}

function write(kind: StorageKind, key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window[kind].removeItem(key);
    else window[kind].setItem(key, value);
  } catch {
    // A full or blocked storage only means the tour may show again; nothing to tell the user.
  }
}

/** How this user left the role's tour last time, or null when they have not seen it. */
export function readTourOutcome(
  userId: string,
  role: TourRole,
): TourOutcome | null {
  const saved = read("localStorage", outcomeKey(userId, role));
  return isEnumValue(TourOutcome, saved) ? saved : null;
}

export function writeTourOutcome(
  userId: string,
  role: TourRole,
  outcome: TourOutcome,
) {
  write("localStorage", outcomeKey(userId, role), outcome);
}

/** The tour this user has open in this tab, so a page change or a reload continues it. */
export function readTourRun(userId: string): TourRun | null {
  const saved = read("sessionStorage", runKey(userId));
  if (saved === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(saved);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const { role, phase, stepIndex } = parsed as Record<string, unknown>;
  if (
    !isEnumValue(TourRole, role) ||
    !isEnumValue(TourPhase, phase) ||
    typeof stepIndex !== "number" ||
    !Number.isInteger(stepIndex) ||
    stepIndex < 0 ||
    // A tour shortened since it was saved: start afresh rather than keep a step that no longer exists.
    stepIndex >= TOURS[role].steps.length
  ) {
    return null;
  }
  return { role, phase, stepIndex };
}

export function writeTourRun(userId: string, run: TourRun | null) {
  write("sessionStorage", runKey(userId), run && JSON.stringify(run));
}
