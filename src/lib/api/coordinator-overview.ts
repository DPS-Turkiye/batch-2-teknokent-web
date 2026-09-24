import "server-only";

import type { CoordinatorOverview } from "@/interfaces/coordinator-overview";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchCoordinatorOverview(
  actorId: string,
  programId: string | null,
) {
  return backendRequest<CoordinatorOverview>({
    method: "GET",
    url: "/api/coordinator/overview",
    params: programId ? { actorId, programId } : { actorId },
  });
}
