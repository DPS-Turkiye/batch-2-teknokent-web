import type {
  CoordinatorSearchResult,
  NewCoordinatorInput,
} from "@/interfaces/admin-coordinator";
import { isEmailAddress } from "@/lib/utils";

/** The backend refuses shorter searches, so nobody is listed before the admin has typed this much. */
export const COORDINATOR_SEARCH_MIN_LENGTH = 3;

export enum CoordinatorChoiceKind {
  Existing = "EXISTING",
  Invited = "INVITED",
}

/** A coordinator the admin picked: an existing account, or an email to invite when the program is saved. */
export type CoordinatorChoice =
  | {
      kind: CoordinatorChoiceKind.Existing;
      id: string;
      fullName: string;
      email: string;
    }
  | { kind: CoordinatorChoiceKind.Invited; fullName: string; email: string };

/** For screens that add each pick straight away, so nothing stays chosen in the field. */
export const NO_COORDINATOR_CHOICES: readonly CoordinatorChoice[] = [];

/** Emails are compared the way the backend compares them: trimmed and case-insensitive. */
export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isSearchable(query: string) {
  return query.trim().length >= COORDINATOR_SEARCH_MIN_LENGTH;
}

export function choiceKey(choice: CoordinatorChoice) {
  return choice.kind === CoordinatorChoiceKind.Existing
    ? choice.id
    : `invite:${normalizeEmail(choice.email)}`;
}

function isChosen(choices: readonly CoordinatorChoice[], email: string) {
  const wanted = normalizeEmail(email);
  return choices.some((choice) => normalizeEmail(choice.email) === wanted);
}

export function existingChoice(
  result: CoordinatorSearchResult,
): CoordinatorChoice {
  return { kind: CoordinatorChoiceKind.Existing, ...result };
}

export function invitedChoice(
  email: string,
  fullName: string,
): CoordinatorChoice {
  return {
    kind: CoordinatorChoiceKind.Invited,
    email: normalizeEmail(email),
    fullName: fullName.trim(),
  };
}

/** Adds a choice unless that email is already chosen. */
export function addChoice(
  choices: readonly CoordinatorChoice[],
  choice: CoordinatorChoice,
): CoordinatorChoice[] {
  return isChosen(choices, choice.email) ? [...choices] : [...choices, choice];
}

export function removeChoice(
  choices: readonly CoordinatorChoice[],
  key: string,
): CoordinatorChoice[] {
  return choices.filter((choice) => choiceKey(choice) !== key);
}

/** Search results the admin has not picked yet. */
export function unpickedResults(
  results: readonly CoordinatorSearchResult[],
  choices: readonly CoordinatorChoice[],
) {
  return results.filter((result) => !isChosen(choices, result.email));
}

/**
 * Whether the typed text should be checked as an invite: a whole email that no search result matches exactly and
 * that is not chosen yet.
 */
export function inviteCandidateEmail(
  query: string,
  results: readonly CoordinatorSearchResult[],
  choices: readonly CoordinatorChoice[],
): string | null {
  const email = normalizeEmail(query);
  if (!isEmailAddress(email) || isChosen(choices, email)) return null;
  const listed = results.some(
    (result) => normalizeEmail(result.email) === email,
  );
  return listed ? null : email;
}

/** The create request's two lists: existing coordinators by id, new emails to invite. */
export function splitChoices(choices: readonly CoordinatorChoice[]): {
  coordinatorIds: string[];
  newCoordinators: NewCoordinatorInput[];
} {
  const coordinatorIds: string[] = [];
  const newCoordinators: NewCoordinatorInput[] = [];
  for (const choice of choices) {
    if (choice.kind === CoordinatorChoiceKind.Existing) {
      coordinatorIds.push(choice.id);
    } else {
      newCoordinators.push({ fullName: choice.fullName, email: choice.email });
    }
  }
  return { coordinatorIds, newCoordinators };
}
