import type { useTranslations } from "next-intl";

import {
  CoordinatorCandidateStatus,
  type CoordinatorAccount,
  type CoordinatorCandidate,
} from "@/interfaces/admin-coordinator";

const ASSIGNABLE = new Set([
  CoordinatorCandidateStatus.New,
  CoordinatorCandidateStatus.Promotable,
  CoordinatorCandidateStatus.Reactivatable,
]);

export function isAssignable(candidate: CoordinatorCandidate | undefined) {
  return candidate !== undefined && ASSIGNABLE.has(candidate.status);
}

export type CoordinatorsT = ReturnType<
  typeof useTranslations<"adminCoordinators">
>;

/** What saving will do, or why it can't, in the admin's words. */
export function candidateMessage(
  candidate: CoordinatorCandidate,
  t: CoordinatorsT,
) {
  return t(`candidate.${candidate.status}`, {
    name: candidate.fullName ?? candidate.email,
    role: candidate.role ? t(`roles.${candidate.role}`) : t("userFallback"),
  });
}

export function addedMessage(account: CoordinatorAccount, t: CoordinatorsT) {
  switch (account.outcome) {
    case CoordinatorCandidateStatus.Promotable:
      return t("promoted", { name: account.fullName });
    case CoordinatorCandidateStatus.Reactivatable:
      return t("reactivated", { name: account.fullName });
    default:
      return t("added", { name: account.fullName, email: account.email });
  }
}

/** A new person needs a name; an existing account keeps the one it has. */
export function nameRequired(candidate: CoordinatorCandidate | undefined) {
  return candidate?.status === CoordinatorCandidateStatus.New;
}

/** A program's coordinators in the admin lists, or "Atanmadı". */
export function programCoordinatorLabel(
  program: { coordinatorName: string | null },
  unassigned: string,
) {
  return program.coordinatorName ?? unassigned;
}
