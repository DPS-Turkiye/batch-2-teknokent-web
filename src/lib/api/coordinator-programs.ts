import "server-only";

import type {
  CoordinatorProgram,
  CreateProgramEventInput,
  ProgramEvent,
} from "@/interfaces/coordinator-program";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchCoordinatorPrograms(actorId: string) {
  return backendRequest<CoordinatorProgram[]>({
    method: "GET",
    url: "/api/coordinator/programs",
    params: { actorId },
  });
}

export function createCoordinatorProgramEvent(
  actorId: string,
  programId: string,
  input: CreateProgramEventInput,
) {
  return backendRequest<ProgramEvent>({
    method: "POST",
    url: `/api/coordinator/programs/${encodeURIComponent(programId)}/events`,
    data: { ...input, actorId },
  });
}
