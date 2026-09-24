import "server-only";

import type { CoordinatorProgram } from "@/interfaces/coordinator-program";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchCoordinatorPrograms(actorId: string) {
  return backendRequest<CoordinatorProgram[]>({
    method: "GET",
    url: "/api/coordinator/programs",
    params: { actorId },
  });
}
