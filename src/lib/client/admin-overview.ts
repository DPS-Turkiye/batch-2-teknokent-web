import type { AdminOverviewResponse } from "@/interfaces/admin-overview";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

export async function getAdminOverview() {
  return requireSuccess(
    await backendHttp.get<AdminOverviewResponse>("/api/admin/overview"),
  );
}
