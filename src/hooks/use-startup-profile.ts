"use client";

import type {
  StartupProfile,
  StartupProfileInput,
} from "@/interfaces/organization";
import { useEditableProfile } from "@/hooks/use-editable-profile";
import {
  getStartupProfile,
  saveStartupProfile,
} from "@/lib/client/organization";
import { validateStartupProfile } from "@/lib/profile-validation";

export const STARTUP_PROFILE_QUERY_KEY = ["startup-profile"] as const;

/** The free-text fields, so the form can drive them all through one setter. */
export type StartupProfileField = Exclude<
  keyof StartupProfileInput,
  "supportAreas" | "fundingStage" | "foundedYear"
>;

function toDraft(profile: StartupProfile): StartupProfileInput {
  return {
    name: profile.name,
    description: profile.description,
    website: profile.website,
    problem: profile.problem,
    solution: profile.solution,
    currentSolution: profile.currentSolution,
    targetUser: profile.targetUser,
    sector: profile.sector,
    maturity: profile.maturity,
    programLevel: profile.programLevel,
    supportAreas: profile.supportAreas,
    fundingStage: profile.fundingStage,
    foundedYear: profile.foundedYear,
  };
}

export function useStartupProfile() {
  return useEditableProfile({
    queryKey: STARTUP_PROFILE_QUERY_KEY,
    load: getStartupProfile,
    save: saveStartupProfile,
    toDraft,
    validate: validateStartupProfile,
  });
}
