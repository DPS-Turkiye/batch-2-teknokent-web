import type { AdminAcademic } from "@/interfaces/admin-academics";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getProgramAcademics(programId: string) {
  return requireSuccess(
    await httpClient.get<AdminAcademic[]>(
      `/api/coordinator/programs/${encodeURIComponent(programId)}/academics`,
    ),
  );
}

export async function getAdminAcademics() {
  return requireSuccess(
    await httpClient.get<AdminAcademic[]>("/api/admin/academics"),
  );
}
