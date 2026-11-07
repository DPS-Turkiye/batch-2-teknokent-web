"use client";

import { useCallback } from "react";

import { useProgramEligibility } from "@/hooks/use-program-eligibility";
import { useProgramNames } from "@/hooks/use-programs";
import type { SignupWizard } from "@/hooks/use-signup-wizard";

/**
 * The program picker on the startup step. Choosing an individual-mentee program (İŞKUR) skips the startup
 * questions, since the backend gives each student a team of one; choosing another program asks them again.
 */
export function useSignupProgramChoice(wizard: SignupWizard) {
  const programs = useProgramNames();
  const { draft, updateStartup } = wizard;
  const selected = programs.data?.find(
    (program) => program.id === draft.startup.programId,
  );
  const individual = selected?.individualMentees ?? false;
  const eligibility = useProgramEligibility(draft.startup.programId);

  const choose = useCallback(
    (name: string) => {
      const match = programs.data?.find((program) => program.name === name);
      if (!match) return;
      updateStartup("programId", match.id);
      if (match.individualMentees) {
        updateStartup("startupLater", true);
      } else if (individual) {
        updateStartup("startupLater", false);
      }
    },
    [individual, programs.data, updateStartup],
  );

  return {
    loading: programs.isLoading,
    options: (programs.data ?? []).map((program) => program.name),
    selectedName: selected?.name ?? "",
    individual,
    checking: eligibility.checking,
    refusal: eligibility.refusal,
    choose,
  };
}
