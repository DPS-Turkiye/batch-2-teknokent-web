import type { AiFeatures } from "@/interfaces/ai-features";
import { AI_FEATURES_ALL_ON } from "@/lib/ai-features";

/** The deployment's AI switches, all on unless a test switches some off. */
export function aiFeatures(overrides: Partial<AiFeatures> = {}): AiFeatures {
  return { ...AI_FEATURES_ALL_ON, ...overrides };
}
