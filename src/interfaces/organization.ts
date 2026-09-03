/**
 * The organization's own startup profile — what the founder typed in the signup
 * wizard's second step. Distinct from `StartupContext` in `startup.ts`, which is
 * derived from a parsed CV or pitch deck: this is what the user said, that is
 * what the parser extracted.
 */
export interface StartupProfile {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  problem: string | null;
  solution: string | null;
  currentSolution: string | null;
  targetUser: string | null;
  sector: string | null;
  maturity: string | null;
  programLevel: string | null;
  supportAreas: string[];
  createdAt: string;
  updatedAt: string;
}

/** The editable half. Identity and timestamps are the server's to set. */
export type StartupProfileInput = Omit<
  StartupProfile,
  "id" | "createdAt" | "updatedAt"
>;
