import "server-only";

import type { AdminAcademic } from "@/interfaces/admin-academics";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchProgramAcademics(actorId: string, programId: string) {
  return backendRequest<AdminAcademic[]>({
    method: HttpMethod.Get,
    url: `/api/coordinator/programs/${encodeURIComponent(programId)}/academics`,
    params: { actorId },
  });
}
