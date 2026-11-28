import type { AdminAcademic } from "@/interfaces/admin-academics";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { httpClient } from "@/lib/http-client";

export async function getProgramAcademics(programId: string) {
  return requireSuccess(
    await backendHttp.get<AdminAcademic[]>(
      `/api/coordinator/programs/${encodeURIComponent(programId)}/academics`,
    ),
  );
}

export async function getAdminAcademics() {
  return requireSuccess(
    await backendHttp.get<AdminAcademic[]>("/api/admin/academics"),
  );
}
