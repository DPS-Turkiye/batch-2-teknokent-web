import type {
  CoordinatorProgram,
  CreateProgramEventInput,
  ProgramEvent,
} from "@/interfaces/coordinator-program";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getCoordinatorPrograms() {
  return requireSuccess(
    await httpClient.get<CoordinatorProgram[]>("/api/coordinator/programs"),
  );
}

export async function createCoordinatorProgramEvent(
  programId: string,
  input: CreateProgramEventInput,
) {
  return requireSuccess(
    await httpClient.post<ProgramEvent>(
      `/api/coordinator/programs/${encodeURIComponent(programId)}/events`,
      input,
    ),
  );
}
