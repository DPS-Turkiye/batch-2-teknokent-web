/** Which AI features this deployment offers (`GET /api/ai-features`); a switched-off one gets the manual path. */
export interface AiFeatures {
  profileParsing: boolean;
  syllabus: boolean;
  matching: boolean;
  meetingReport: boolean;
  taskHandover: boolean;
}

/** Codes the backend puts on an error body for a client to branch on. */
export const BackendErrorCode = {
  AiFeatureDisabled: "AI_FEATURE_DISABLED",
} as const;
