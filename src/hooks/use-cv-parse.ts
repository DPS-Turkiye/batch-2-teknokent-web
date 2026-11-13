"use client";

import { useMutation } from "@tanstack/react-query";

import {
  parseCv,
  parseStoredCv,
  type CvSource,
  type ParsedCvProfile,
} from "@/lib/client/profile-analysis";

export type CvParseResult = {
  role: string;
  summary: string;
  expertise: string[];
};

/** The parser is a model, so a list it returns may hold nulls despite the schema. */
function texts(...lists: (readonly (string | null)[] | null | undefined)[]) {
  const seen = new Set<string>();
  for (const list of lists) {
    for (const value of list ?? []) {
      const trimmed = value?.trim();
      if (trimmed) seen.add(trimmed);
    }
  }
  return [...seen];
}

/**
 * The parsed CV, mapped onto the fields this step actually shows.
 *
 * Expertise merges three parsed lists — what the person does, what they work
 * with, and where. They are separate in the schema but one idea to a mentee
 * filling in "Uzmanlık alanları", and duplicates across them are dropped.
 */
export function toCvParseResult(profile: ParsedCvProfile): CvParseResult {
  return {
    role: profile.current_role?.trim() || profile.desired_role?.trim() || "",
    summary: profile.professional_summary?.trim() || "",
    expertise: texts(
      profile.professional_functions,
      profile.technologies,
      profile.industries,
    ),
  };
}

/**
 * Parsing is a suggestion, never an overwrite: the caller decides what to apply,
 * and the user can edit or remove anything afterwards. The pipeline's own design
 * is parse → review → confirm, and signup does not get to skip the review.
 */
export function useCvParse() {
  return useMutation({
    mutationFn: async ({
      source,
      consentAccepted,
    }: {
      source: CvSource;
      consentAccepted: boolean;
    }) =>
      toCvParseResult(
        await (source instanceof File
          ? parseCv(source, consentAccepted)
          : parseStoredCv(source.documentId, consentAccepted)),
      ),
  });
}
