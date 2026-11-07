"use client";

import { useMemo } from "react";

import { useIndividualProgram } from "@/hooks/use-individual-program";
import { needChoices } from "@/lib/mentor-request-need";

/** The topics and situations the signed-in mentee's mentor request offers: students get their own lists. */
export function useNeedChoices() {
  const { individual } = useIndividualProgram();
  return useMemo(
    () => ({ individual, ...needChoices(individual) }),
    [individual],
  );
}
