import type { AiFeatures } from "@/interfaces/ai-features";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getAiFeatures() {
  return requireSuccess(await httpClient.get<AiFeatures>("/api/ai-features"));
}
