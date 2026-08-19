import "server-only";

import { backendRequest } from "@/lib/server/backend-client";

export function fetchDashboardSummary(organizationId: string) {
  return backendRequest({
    method: "GET",
    url: "/api/dashboard/summary",
    params: { organizationId },
  });
}
