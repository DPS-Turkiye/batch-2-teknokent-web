import "server-only";

import type { AiFeatures } from "@/interfaces/ai-features";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchAiFeatures() {
  return backendRequest<AiFeatures>({
    method: HttpMethod.Get,
    url: "/api/ai-features",
  });
}
