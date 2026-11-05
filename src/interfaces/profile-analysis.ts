export type ProfileType = "individual_mentee" | "mentee" | "mentor";
export type OcrMode = "auto" | "force" | "off";

export type ProfileAnalysis = {
  id: string;
  appUserId?: string | null;
  sourceFilename: string;
  profileType: ProfileType;
  profile: Record<string, unknown> | string;
  status: "DRAFT" | "CONFIRMED";
  consentAcceptedAt?: string | null;
  redactionSummary?: Record<string, number> | string;
  ocrSummary?: Record<string, unknown> | string;
  createdAt: string;
};

export enum ProfileAnalysisType {
  Startup = "mentee",
  Personal = "individual_mentee",
}
export enum ProfileAnalysisStatus {
  Draft = "DRAFT",
  Confirmed = "CONFIRMED",
}
export enum ProfileOcrMode {
  Auto = "auto",
  Force = "force",
  Off = "off",
}

export enum ProfileAnalysisRecordScope {
  Startup = "STARTUP",
  Personal = "PERSONAL",
  TeamPersonal = "TEAM_PERSONAL",
}
