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
