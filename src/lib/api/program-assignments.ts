import "server-only";

import type {
  CreateProgramAssignmentInput,
  ProgramAssignment,
} from "@/interfaces/program-assignment";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

const programUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/assignments`;

export function fetchProgramAssignments(actorId: string, programId: string) {
  return backendRequest<ProgramAssignment[]>({
    method: HttpMethod.Get,
    url: programUrl(programId),
    params: { actorId },
  });
}

export function createProgramAssignment(
  actorId: string,
  programId: string,
  input: CreateProgramAssignmentInput,
) {
  return backendRequest<ProgramAssignment>({
    method: HttpMethod.Post,
    url: programUrl(programId),
    data: { actorId, ...input },
  });
}
