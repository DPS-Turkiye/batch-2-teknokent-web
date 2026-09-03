// Distinct from StartupContext in startup.ts, which is parsed from a CV/deck.
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
