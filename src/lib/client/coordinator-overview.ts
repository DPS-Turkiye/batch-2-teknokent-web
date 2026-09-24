import type { CoordinatorOverview } from "@/interfaces/coordinator-overview";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getCoordinatorOverview(programId: string | null) {
  return requireSuccess(
    await httpClient.get<CoordinatorOverview>("/api/coordinator/overview", {
      params: programId ? { programId } : undefined,
    }),
  );
}
