import type { AdminOverview } from "@/interfaces/admin-overview";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getAdminOverview() {
  return requireSuccess(
    await httpClient.get<AdminOverview>("/api/admin/overview"),
  );
}
