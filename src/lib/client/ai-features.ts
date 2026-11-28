import type { AiFeatures } from "@/interfaces/ai-features";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

export async function getAiFeatures() {
  return requireSuccess(await backendHttp.get<AiFeatures>("/api/ai-features"));
}
