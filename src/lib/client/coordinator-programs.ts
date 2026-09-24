import type { CoordinatorProgram } from "@/interfaces/coordinator-program";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getCoordinatorPrograms() {
  return requireSuccess(
    await httpClient.get<CoordinatorProgram[]>("/api/coordinator/programs"),
  );
}
