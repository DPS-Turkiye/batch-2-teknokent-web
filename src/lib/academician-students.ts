import type { InstitutionPersonSummary } from "@/interfaces/institution";

/** The Menton ids of the academician's advisees; people who never signed in have none to match. */
export function adviseeIds(advisees: readonly InstitutionPersonSummary[]) {
  return new Set(
    advisees.flatMap((advisee) =>
      advisee.userId === null ? [] : [advisee.userId],
    ),
  );
}
