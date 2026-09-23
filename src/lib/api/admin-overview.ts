import "server-only";

import type { AdminOverview } from "@/interfaces/admin-overview";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchAdminOverview(actorId: string) {
  return backendRequest<AdminOverview>({
    method: "GET",
    url: "/api/admin/overview",
    params: { actorId },
  });
}
