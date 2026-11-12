import { BackendErrorCode, type AiFeatures } from "@/interfaces/ai-features";
import { ClientApiError } from "@/lib/client/api";

/**
 * What a screen assumes until the switches have loaded, or when they cannot be read: everything on, as on
 * Teknokent. The backend refuses a switched-off feature on its own, so assuming "on" never sends data out.
 */
export const AI_FEATURES_ALL_ON: AiFeatures = {
  profileParsing: true,
  syllabus: true,
  matching: true,
  meetingReport: true,
  taskHandover: true,
};

/** True when the backend refused a call because its AI feature is switched off on this deployment. */
export function isAiFeatureDisabledError(error: unknown) {
  return (
    error instanceof ClientApiError &&
    error.code === BackendErrorCode.AiFeatureDisabled
  );
}
