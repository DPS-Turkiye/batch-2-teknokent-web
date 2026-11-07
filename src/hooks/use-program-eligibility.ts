"use client";

import { useQuery } from "@tanstack/react-query";

import type { SignupWizard } from "@/hooks/use-signup-wizard";
import { SignupStep } from "@/interfaces/signup";
import { getProgramEligibility } from "@/lib/client/auth";
import { currentIdToken } from "@/lib/firebase/auth";

export const PROGRAM_ELIGIBILITY_QUERY_KEY = ["program-eligibility"] as const;

/**
 * Asks the backend, as soon as a program is picked, whether the signed-in address may join it (İŞKUR: on the
 * domain and on the coordinator's list). A failed check does not block: the backend still refuses at submit.
 */
export function useProgramEligibility(programId: string | null | undefined) {
  const query = useQuery({
    queryKey: [...PROGRAM_ELIGIBILITY_QUERY_KEY, programId],
    queryFn: async () => {
      const idToken = await currentIdToken();
      if (!idToken || !programId) return null;
      return getProgramEligibility(programId, idToken);
    },
    enabled: Boolean(programId),
    retry: false,
    staleTime: 60_000,
  });
  const refusal =
    query.data && !query.data.eligible ? (query.data.message ?? "") : null;
  const checking = Boolean(programId) && query.isLoading;
  return { checking, refusal, allowed: !checking && refusal === null };
}

/** The wizard's own rule for "Devam", plus: once past the first step, the chosen program must accept the address. */
export function useSignupCanContinue(wizard: SignupWizard) {
  const eligibility = useProgramEligibility(wizard.draft.startup.programId);
  if (wizard.step === SignupStep.PersonalProfile) return wizard.canContinue;
  return wizard.canContinue && eligibility.allowed;
}
