import type { CoordinatorOverview } from "@/interfaces/coordinator-overview";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

export async function getCoordinatorOverview(programId: string | null) {
  return requireSuccess(
    await backendHttp.get<CoordinatorOverview>("/api/coordinator/overview", {
      params: programId ? { programId } : undefined,
    }),
  );
}
