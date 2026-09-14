// Distinct from StartupContext in startup.ts, which is parsed from a CV/deck.
/** Mirrors the backend's StartupFundingStage, which sends these labels as its values. */
export enum StartupFundingStage {
  Bootstrapped = "Kendi kaynaklarıyla",
  PreSeed = "Pre-seed",
  Seed = "Seed",
  SeriesA = "Seri A",
  SeriesBPlus = "Seri B ve sonrası",
}

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
  statusVersion: string | null;
  statusSummary: string | null;
  completionPercent: number | null;
  fundingStage: StartupFundingStage | null;
  foundedYear: number | null;
  createdAt: string;
  updatedAt: string;
}

/** The "Durum" card. Saved on its own so the profile form can never wipe it. */
export type StartupStatusInput = Pick<
  StartupProfile,
  "statusVersion" | "statusSummary" | "completionPercent"
>;

/** The editable half. Identity, timestamps and the status are saved elsewhere. */
export type StartupProfileInput = Omit<
  StartupProfile,
  "id" | "createdAt" | "updatedAt" | keyof StartupStatusInput
>;
